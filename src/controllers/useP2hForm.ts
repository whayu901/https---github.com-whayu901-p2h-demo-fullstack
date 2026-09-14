import {
  P2H_SECTIONS,
  P2H_SECTION_LABELS,
  type HasilItemP2H,
  type HasilItemValue,
  type HasilKelayakan,
  type KodeBahaya,
  type P2HSection,
  type Shift,
  type Unit,
  type UnitType,
  getChecklist,
  hitungStatusKelayakan,
} from '@p2h/shared';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import {
  type LocalInspection,
  deletePhotoFile,
  findInspectionById,
  findUnitById,
  insertInspection,
  updateInspection,
  useDatabase,
} from '../models';
import { isValidDateString, todayDateString } from './date-helpers';
import { captureLocation } from './gps';
import { usePhotoCapture } from './usePhotoCapture';
import { useUnits } from './useUnits';

export interface AnswerRow {
  key: string;
  label: string;
  section: P2HSection;
  kodeBahaya: KodeBahaya;
  hasil: HasilItemValue | null;
  keterangan: string;
}

export interface SectionGroup {
  section: P2HSection;
  label: string;
  items: AnswerRow[];
}

export interface VerdictPreview extends HasilKelayakan {
  unansweredCount: number;
  totalCount: number;
}

/** Lifecycle of the edit flow — the screen renders very differently per state. */
export type P2hEditStatus = 'new' | 'loading' | 'ready' | 'not_found' | 'blocked';

export interface UseP2hFormResult {
  editStatus: P2hEditStatus;
  units: Unit[];
  selectedUnit: Unit | null;
  selectUnit: (unit: Unit) => void;
  namaOperator: string;
  setNamaOperator: (value: string) => void;
  nrp: string;
  setNrp: (value: string) => void;
  tanggal: string;
  setTanggal: (value: string) => void;
  shift: Shift | null;
  setShift: (value: Shift) => void;
  lokasiKerja: string;
  setLokasiKerja: (value: string) => void;
  hmKmAwal: string;
  setHmKmAwal: (value: string) => void;
  hmKmAkhir: string;
  setHmKmAkhir: (value: string) => void;
  sections: SectionGroup[];
  setHasil: (key: string, hasil: HasilItemValue) => void;
  setKeterangan: (key: string, keterangan: string) => void;
  fillSemuaNormal: (section: P2HSection) => void;
  verdict: VerdictPreview;
  pernyataanOperator: boolean;
  setPernyataanOperator: (value: boolean) => void;
  catatanOperator: string;
  setCatatanOperator: (value: string) => void;
  photoUri: string | null;
  photoError: string | null;
  takePhoto: () => Promise<void>;
  pickPhotoFromGallery: () => Promise<void>;
  clearPhoto: () => void;
  saving: boolean;
  validationError: string | null;
  save: () => Promise<void>;
}

function buildAnswerRows(unitType: UnitType, existing?: readonly HasilItemP2H[]): AnswerRow[] {
  const existingByKey = new Map((existing ?? []).map((item) => [item.key, item]));
  return getChecklist(unitType).map((item) => {
    const found = existingByKey.get(item.key);
    return {
      key: item.key,
      label: item.label,
      section: item.section,
      kodeBahaya: item.kodeBahaya,
      hasil: found?.hasil ?? null,
      keterangan: found?.keterangan ?? '',
    };
  });
}

function groupBySection(answers: AnswerRow[]): SectionGroup[] {
  return P2H_SECTIONS.map((section) => ({
    section,
    label: P2H_SECTION_LABELS[section],
    items: answers.filter((answer) => answer.section === section),
  }));
}

function toHasilItems(answers: readonly AnswerRow[]): HasilItemP2H[] {
  return answers
    .filter((answer): answer is AnswerRow & { hasil: HasilItemValue } => answer.hasil !== null)
    .map((answer) => ({
      key: answer.key,
      label: answer.label,
      section: answer.section,
      kodeBahaya: answer.kodeBahaya,
      hasil: answer.hasil,
      keterangan: answer.keterangan.trim().length > 0 ? answer.keterangan.trim() : undefined,
    }));
}

/**
 * Business logic and validation for the P2H (daily inspection) form, shared
 * by the new-record and edit-record screens. Pass `editId` to load and edit
 * an existing PENDING record; omit it to create a brand-new one.
 */
export function useP2hForm(editId?: string): UseP2hFormResult {
  const db = useDatabase();
  const router = useRouter();
  const { units } = useUnits();
  const photo = usePhotoCapture();

  const [editStatus, setEditStatus] = useState<P2hEditStatus>(editId ? 'loading' : 'new');
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [namaOperator, setNamaOperator] = useState('');
  const [nrp, setNrp] = useState('');
  const [tanggal, setTanggal] = useState(todayDateString());
  const [shift, setShift] = useState<Shift | null>(null);
  const [lokasiKerja, setLokasiKerja] = useState('');
  const [hmKmAwal, setHmKmAwal] = useState('');
  const [hmKmAkhir, setHmKmAkhir] = useState('');
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [pernyataanOperator, setPernyataanOperator] = useState(false);
  const [catatanOperator, setCatatanOperator] = useState('');
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Preserved across an edit so we don't clobber the original creation time
  // or GPS fix — only a brand-new photo/location capture ever replaces them.
  const [original, setOriginal] = useState<LocalInspection | null>(null);

  useEffect(() => {
    if (!editId) {
      return;
    }
    let active = true;
    (async () => {
      const inspection = await findInspectionById(db, editId);
      if (!active) {
        return;
      }
      if (!inspection) {
        setEditStatus('not_found');
        return;
      }
      if (inspection.syncStatus !== 'PENDING') {
        setEditStatus('blocked');
        return;
      }

      const unit = await findUnitById(db, inspection.unitId);
      if (!active) {
        return;
      }

      setOriginal(inspection);
      setSelectedUnit(unit);
      setNamaOperator(inspection.namaOperator);
      setNrp(inspection.nrp);
      setTanggal(inspection.tanggal);
      setShift(inspection.shift);
      setLokasiKerja(inspection.lokasiKerja);
      setHmKmAwal(String(inspection.hmKmAwal));
      setHmKmAkhir(inspection.hmKmAkhir !== null ? String(inspection.hmKmAkhir) : '');
      setPernyataanOperator(inspection.pernyataanOperator);
      setCatatanOperator(inspection.catatanOperator);
      photo.setInitialPhoto(inspection.fotoUri);
      if (unit) {
        setAnswers(buildAnswerRows(unit.type, inspection.items));
      }
      setEditStatus('ready');
    })();
    return () => {
      active = false;
    };
    // Runs once for the lifetime of this screen instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, editId]);

  const selectUnit = useCallback((unit: Unit) => {
    setSelectedUnit(unit);
    setAnswers(buildAnswerRows(unit.type));
  }, []);

  const setHasil = useCallback((key: string, hasil: HasilItemValue) => {
    setAnswers((prev) => prev.map((answer) => (answer.key === key ? { ...answer, hasil } : answer)));
  }, []);

  const setKeterangan = useCallback((key: string, keterangan: string) => {
    setAnswers((prev) => prev.map((answer) => (answer.key === key ? { ...answer, keterangan } : answer)));
  }, []);

  const fillSemuaNormal = useCallback((section: P2HSection) => {
    setAnswers((prev) =>
      prev.map((answer) =>
        answer.section === section && answer.hasil === null ? { ...answer, hasil: 'NORMAL' } : answer
      )
    );
  }, []);

  const sections = useMemo(() => groupBySection(answers), [answers]);

  const verdict = useMemo<VerdictPreview>(() => {
    const answered = toHasilItems(answers);
    const base = hitungStatusKelayakan(answered);
    return {
      ...base,
      unansweredCount: answers.length - answered.length,
      totalCount: answers.length,
    };
  }, [answers]);

  const save = useCallback(async () => {
    setValidationError(null);

    if (!selectedUnit) {
      setValidationError('Pilih unit terlebih dahulu.');
      return;
    }
    if (namaOperator.trim().length === 0) {
      setValidationError('Nama operator wajib diisi.');
      return;
    }
    if (nrp.trim().length === 0) {
      setValidationError('NRP wajib diisi.');
      return;
    }
    if (!isValidDateString(tanggal)) {
      setValidationError('Format tanggal tidak valid (YYYY-MM-DD).');
      return;
    }
    if (!shift) {
      setValidationError('Pilih shift terlebih dahulu.');
      return;
    }
    if (lokasiKerja.trim().length === 0) {
      setValidationError('Lokasi kerja wajib diisi.');
      return;
    }
    const hmKmAwalValue = Number.parseFloat(hmKmAwal);
    if (hmKmAwal.trim().length === 0 || Number.isNaN(hmKmAwalValue)) {
      setValidationError('HM/KM awal wajib diisi dengan angka.');
      return;
    }
    let hmKmAkhirValue: number | null = null;
    if (hmKmAkhir.trim().length > 0) {
      hmKmAkhirValue = Number.parseFloat(hmKmAkhir);
      if (Number.isNaN(hmKmAkhirValue)) {
        setValidationError('HM/KM akhir harus berupa angka.');
        return;
      }
      if (hmKmAkhirValue < hmKmAwalValue) {
        setValidationError('HM/KM akhir harus lebih besar atau sama dengan HM/KM awal.');
        return;
      }
    }
    const unanswered = answers.find((answer) => answer.hasil === null);
    if (unanswered) {
      setValidationError(`Item "${unanswered.label}" belum diperiksa.`);
      return;
    }
    if (!pernyataanOperator) {
      setValidationError('Pernyataan operator wajib dicentang.');
      return;
    }

    setSaving(true);
    try {
      const isEdit = original !== null;
      const location = isEdit
        ? { latitude: original.latitude, longitude: original.longitude }
        : await captureLocation();

      const inspection: LocalInspection = {
        id: isEdit ? original.id : Crypto.randomUUID(),
        unitId: selectedUnit.id,
        namaOperator: namaOperator.trim(),
        nrp: nrp.trim(),
        tanggal,
        shift,
        lokasiKerja: lokasiKerja.trim(),
        hmKmAwal: hmKmAwalValue,
        hmKmAkhir: hmKmAkhirValue,
        items: toHasilItems(answers),
        statusKelayakan: verdict.status,
        pernyataanOperator,
        catatanOperator: catatanOperator.trim(),
        rekomendasiMekanik: null,
        keputusanPengawas: null,
        fotoUri: photo.photoUri,
        latitude: location.latitude,
        longitude: location.longitude,
        dibuatPada: isEdit ? original.dibuatPada : new Date().toISOString(),
        syncStatus: 'PENDING',
        syncedAt: null,
      };

      if (isEdit) {
        const changed = await updateInspection(db, inspection);
        if (!changed) {
          setValidationError('Data sudah tersinkron dan tidak bisa diubah.');
          setSaving(false);
          return;
        }
        if (original.fotoUri && original.fotoUri !== inspection.fotoUri) {
          deletePhotoFile(original.fotoUri);
        }
      } else {
        await insertInspection(db, inspection);
      }

      Alert.alert('Tersimpan', 'Tersimpan di perangkat (menunggu sinkronisasi)', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      setValidationError('Gagal menyimpan ke perangkat. Coba lagi.');
    } finally {
      setSaving(false);
    }
  }, [
    answers,
    catatanOperator,
    db,
    hmKmAkhir,
    hmKmAwal,
    lokasiKerja,
    namaOperator,
    nrp,
    original,
    pernyataanOperator,
    photo.photoUri,
    router,
    selectedUnit,
    shift,
    tanggal,
    verdict.status,
  ]);

  return {
    editStatus,
    units,
    selectedUnit,
    selectUnit,
    namaOperator,
    setNamaOperator,
    nrp,
    setNrp,
    tanggal,
    setTanggal,
    shift,
    setShift,
    lokasiKerja,
    setLokasiKerja,
    hmKmAwal,
    setHmKmAwal,
    hmKmAkhir,
    setHmKmAkhir,
    sections,
    setHasil,
    setKeterangan,
    fillSemuaNormal,
    verdict,
    pernyataanOperator,
    setPernyataanOperator,
    catatanOperator,
    setCatatanOperator,
    photoUri: photo.photoUri,
    photoError: photo.error,
    takePhoto: photo.takePhoto,
    pickPhotoFromGallery: photo.pickFromGallery,
    clearPhoto: photo.clearPhoto,
    saving,
    validationError,
    save,
  };
}
