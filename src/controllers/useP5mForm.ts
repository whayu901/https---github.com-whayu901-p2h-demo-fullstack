import { type PesertaP5M, type Shift, hitungPesertaHadir } from '@p2h/shared';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import {
  type LocalSafetyTalk,
  deletePhotoFile,
  findSafetyTalkById,
  insertSafetyTalk,
  updateSafetyTalk,
  useDatabase,
} from '../models';
import { isValidDateString, isValidTimeString, nowTimeString, todayDateString } from './date-helpers';
import { captureLocation } from './gps';
import { usePhotoCapture } from './usePhotoCapture';

/** Lifecycle of the edit flow — the screen renders very differently per state. */
export type P5mEditStatus = 'new' | 'loading' | 'ready' | 'not_found' | 'blocked';

export interface UseP5mFormResult {
  editStatus: P5mEditStatus;
  tanggal: string;
  setTanggal: (value: string) => void;
  jamMulai: string;
  setJamMulai: (value: string) => void;
  shift: Shift | null;
  setShift: (value: Shift) => void;
  lokasiArea: string;
  setLokasiArea: (value: string) => void;
  departemenRegu: string;
  setDepartemenRegu: (value: string) => void;
  namaPemimpin: string;
  setNamaPemimpin: (value: string) => void;
  nrpPemimpin: string;
  setNrpPemimpin: (value: string) => void;
  topik: string;
  setTopik: (value: string) => void;
  uraianSingkat: string;
  setUraianSingkat: (value: string) => void;
  potensiBahayaInput: string;
  setPotensiBahayaInput: (value: string) => void;
  potensiBahaya: string[];
  addPotensiBahaya: () => void;
  removePotensiBahaya: (index: number) => void;
  komitmenInput: string;
  setKomitmenInput: (value: string) => void;
  komitmenPengendalian: string[];
  addKomitmen: () => void;
  removeKomitmen: (index: number) => void;
  informasiPengumuman: string;
  setInformasiPengumuman: (value: string) => void;
  pesertaNamaInput: string;
  setPesertaNamaInput: (value: string) => void;
  pesertaNrpInput: string;
  setPesertaNrpInput: (value: string) => void;
  peserta: PesertaP5M[];
  addPeserta: () => void;
  removePeserta: (index: number) => void;
  toggleHadir: (index: number) => void;
  jumlahHadir: number;
  catatan: string;
  setCatatan: (value: string) => void;
  photoUri: string | null;
  photoError: string | null;
  takePhoto: () => Promise<void>;
  pickPhotoFromGallery: () => Promise<void>;
  clearPhoto: () => void;
  saving: boolean;
  validationError: string | null;
  save: () => Promise<void>;
}

/**
 * Business logic and validation for the P5M (pre-shift safety talk) form,
 * shared by the new-record and edit-record screens. Pass `editId` to load and
 * edit an existing PENDING record; omit it to create a brand-new one.
 */
export function useP5mForm(editId?: string): UseP5mFormResult {
  const db = useDatabase();
  const router = useRouter();
  const photo = usePhotoCapture();

  const [editStatus, setEditStatus] = useState<P5mEditStatus>(editId ? 'loading' : 'new');
  const [tanggal, setTanggal] = useState(todayDateString());
  const [jamMulai, setJamMulai] = useState(nowTimeString());
  const [shift, setShift] = useState<Shift | null>(null);
  const [lokasiArea, setLokasiArea] = useState('');
  const [departemenRegu, setDepartemenRegu] = useState('');
  const [namaPemimpin, setNamaPemimpin] = useState('');
  const [nrpPemimpin, setNrpPemimpin] = useState('');
  const [topik, setTopik] = useState('');
  const [uraianSingkat, setUraianSingkat] = useState('');
  const [potensiBahayaInput, setPotensiBahayaInput] = useState('');
  const [potensiBahaya, setPotensiBahaya] = useState<string[]>([]);
  const [komitmenInput, setKomitmenInput] = useState('');
  const [komitmenPengendalian, setKomitmenPengendalian] = useState<string[]>([]);
  const [informasiPengumuman, setInformasiPengumuman] = useState('');
  const [pesertaNamaInput, setPesertaNamaInput] = useState('');
  const [pesertaNrpInput, setPesertaNrpInput] = useState('');
  const [peserta, setPeserta] = useState<PesertaP5M[]>([]);
  const [catatan, setCatatan] = useState('');
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [original, setOriginal] = useState<LocalSafetyTalk | null>(null);

  useEffect(() => {
    if (!editId) {
      return;
    }
    let active = true;
    (async () => {
      const talk = await findSafetyTalkById(db, editId);
      if (!active) {
        return;
      }
      if (!talk) {
        setEditStatus('not_found');
        return;
      }
      if (talk.syncStatus !== 'PENDING') {
        setEditStatus('blocked');
        return;
      }

      setOriginal(talk);
      setTanggal(talk.tanggal);
      setJamMulai(talk.jamMulai);
      setShift(talk.shift);
      setLokasiArea(talk.lokasiArea);
      setDepartemenRegu(talk.departemenRegu);
      setNamaPemimpin(talk.namaPemimpin);
      setNrpPemimpin(talk.nrpPemimpin);
      setTopik(talk.topik);
      setUraianSingkat(talk.uraianSingkat);
      setPotensiBahaya(talk.potensiBahaya);
      setKomitmenPengendalian(talk.komitmenPengendalian);
      setInformasiPengumuman(talk.informasiPengumuman);
      setPeserta(talk.peserta);
      setCatatan(talk.catatan);
      photo.setInitialPhoto(talk.fotoUri);
      setEditStatus('ready');
    })();
    return () => {
      active = false;
    };
    // Runs once for the lifetime of this screen instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, editId]);

  const addPotensiBahaya = useCallback(() => {
    const value = potensiBahayaInput.trim();
    if (value.length === 0) {
      return;
    }
    setPotensiBahaya((prev) => [...prev, value]);
    setPotensiBahayaInput('');
  }, [potensiBahayaInput]);

  const removePotensiBahaya = useCallback((index: number) => {
    setPotensiBahaya((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addKomitmen = useCallback(() => {
    const value = komitmenInput.trim();
    if (value.length === 0) {
      return;
    }
    setKomitmenPengendalian((prev) => [...prev, value]);
    setKomitmenInput('');
  }, [komitmenInput]);

  const removeKomitmen = useCallback((index: number) => {
    setKomitmenPengendalian((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addPeserta = useCallback(() => {
    const nama = pesertaNamaInput.trim();
    const nrp = pesertaNrpInput.trim();
    if (nama.length === 0 || nrp.length === 0) {
      return;
    }
    setPeserta((prev) => [...prev, { nama, nrp, hadir: true }]);
    setPesertaNamaInput('');
    setPesertaNrpInput('');
  }, [pesertaNamaInput, pesertaNrpInput]);

  const removePeserta = useCallback((index: number) => {
    setPeserta((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleHadir = useCallback((index: number) => {
    setPeserta((prev) =>
      prev.map((item, i) => (i === index ? { ...item, hadir: !item.hadir } : item))
    );
  }, []);

  const jumlahHadir = hitungPesertaHadir(peserta);

  const save = useCallback(async () => {
    setValidationError(null);

    if (!isValidDateString(tanggal)) {
      setValidationError('Format tanggal tidak valid (YYYY-MM-DD).');
      return;
    }
    if (!isValidTimeString(jamMulai)) {
      setValidationError('Format jam mulai tidak valid (HH:mm).');
      return;
    }
    if (!shift) {
      setValidationError('Pilih shift terlebih dahulu.');
      return;
    }
    if (lokasiArea.trim().length === 0) {
      setValidationError('Lokasi/area wajib diisi.');
      return;
    }
    if (namaPemimpin.trim().length === 0) {
      setValidationError('Nama pemimpin wajib diisi.');
      return;
    }
    if (nrpPemimpin.trim().length === 0) {
      setValidationError('NRP pemimpin wajib diisi.');
      return;
    }
    if (topik.trim().length === 0) {
      setValidationError('Topik wajib diisi.');
      return;
    }
    if (potensiBahaya.length === 0) {
      setValidationError('Tambahkan minimal satu potensi bahaya.');
      return;
    }
    if (komitmenPengendalian.length === 0) {
      setValidationError('Tambahkan minimal satu komitmen pengendalian.');
      return;
    }
    if (peserta.length === 0) {
      setValidationError('Tambahkan minimal satu peserta.');
      return;
    }

    setSaving(true);
    try {
      const isEdit = original !== null;
      const location = isEdit
        ? { latitude: original.latitude, longitude: original.longitude }
        : await captureLocation();

      const talk: LocalSafetyTalk = {
        id: isEdit ? original.id : Crypto.randomUUID(),
        tanggal,
        jamMulai,
        shift,
        lokasiArea: lokasiArea.trim(),
        departemenRegu: departemenRegu.trim(),
        namaPemimpin: namaPemimpin.trim(),
        nrpPemimpin: nrpPemimpin.trim(),
        topik: topik.trim(),
        uraianSingkat: uraianSingkat.trim(),
        potensiBahaya,
        komitmenPengendalian,
        informasiPengumuman: informasiPengumuman.trim(),
        peserta,
        fotoUri: photo.photoUri,
        latitude: location.latitude,
        longitude: location.longitude,
        catatan: catatan.trim(),
        dibuatPada: isEdit ? original.dibuatPada : new Date().toISOString(),
        syncStatus: 'PENDING',
        syncedAt: null,
      };

      if (isEdit) {
        const changed = await updateSafetyTalk(db, talk);
        if (!changed) {
          setValidationError('Data sudah tersinkron dan tidak bisa diubah.');
          setSaving(false);
          return;
        }
        if (original.fotoUri && original.fotoUri !== talk.fotoUri) {
          deletePhotoFile(original.fotoUri);
        }
      } else {
        await insertSafetyTalk(db, talk);
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
    catatan,
    db,
    departemenRegu,
    informasiPengumuman,
    jamMulai,
    komitmenPengendalian,
    lokasiArea,
    namaPemimpin,
    nrpPemimpin,
    original,
    peserta,
    photo.photoUri,
    potensiBahaya,
    router,
    shift,
    tanggal,
    topik,
    uraianSingkat,
  ]);

  return {
    editStatus,
    tanggal,
    setTanggal,
    jamMulai,
    setJamMulai,
    shift,
    setShift,
    lokasiArea,
    setLokasiArea,
    departemenRegu,
    setDepartemenRegu,
    namaPemimpin,
    setNamaPemimpin,
    nrpPemimpin,
    setNrpPemimpin,
    topik,
    setTopik,
    uraianSingkat,
    setUraianSingkat,
    potensiBahayaInput,
    setPotensiBahayaInput,
    potensiBahaya,
    addPotensiBahaya,
    removePotensiBahaya,
    komitmenInput,
    setKomitmenInput,
    komitmenPengendalian,
    addKomitmen,
    removeKomitmen,
    informasiPengumuman,
    setInformasiPengumuman,
    pesertaNamaInput,
    setPesertaNamaInput,
    pesertaNrpInput,
    setPesertaNrpInput,
    peserta,
    addPeserta,
    removePeserta,
    toggleHadir,
    jumlahHadir,
    catatan,
    setCatatan,
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
