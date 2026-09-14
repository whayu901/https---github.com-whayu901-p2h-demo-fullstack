import type { InspectionDto, SafetyTalkDto, SyncBatchRequest } from '@p2h/shared';

import {
  type Database,
  type LocalInspection,
  type LocalSafetyTalk,
  listPendingInspections,
  listPendingSafetyTalks,
  markInspectionsSynced,
  markSafetyTalksSynced,
  postSyncBatch,
  readPhotoBase64,
  setLastSyncAt,
} from '../models';
import { resolveApiUrl } from './settings-service';

export interface SyncOutcome {
  hadPending: boolean;
  syncedInspections: number;
  syncedSafetyTalks: number;
}

async function toInspectionDto(inspection: LocalInspection): Promise<InspectionDto> {
  return {
    id: inspection.id,
    unitId: inspection.unitId,
    namaOperator: inspection.namaOperator,
    nrp: inspection.nrp,
    tanggal: inspection.tanggal,
    shift: inspection.shift,
    lokasiKerja: inspection.lokasiKerja,
    hmKmAwal: inspection.hmKmAwal,
    hmKmAkhir: inspection.hmKmAkhir,
    items: inspection.items,
    pernyataanOperator: inspection.pernyataanOperator,
    catatanOperator: inspection.catatanOperator,
    rekomendasiMekanik: inspection.rekomendasiMekanik,
    keputusanPengawas: inspection.keputusanPengawas,
    fotoBase64: await readPhotoBase64(inspection.fotoUri),
    latitude: inspection.latitude,
    longitude: inspection.longitude,
    dibuatPada: inspection.dibuatPada,
  };
}

async function toSafetyTalkDto(talk: LocalSafetyTalk): Promise<SafetyTalkDto> {
  return {
    id: talk.id,
    tanggal: talk.tanggal,
    jamMulai: talk.jamMulai,
    shift: talk.shift,
    lokasiArea: talk.lokasiArea,
    departemenRegu: talk.departemenRegu,
    namaPemimpin: talk.namaPemimpin,
    nrpPemimpin: talk.nrpPemimpin,
    topik: talk.topik,
    uraianSingkat: talk.uraianSingkat,
    potensiBahaya: talk.potensiBahaya,
    komitmenPengendalian: talk.komitmenPengendalian,
    informasiPengumuman: talk.informasiPengumuman,
    peserta: talk.peserta,
    fotoBase64: await readPhotoBase64(talk.fotoUri),
    latitude: talk.latitude,
    longitude: talk.longitude,
    catatan: talk.catatan,
    dibuatPada: talk.dibuatPada,
  };
}

/**
 * Gathers every PENDING inspection and safety talk, pushes them as a single
 * batch to the effective API URL, and marks the sent records SYNCED. Leaves
 * everything PENDING (throws `SyncError`, from `models/api-client`) if the
 * push fails.
 */
export async function syncPendingRecords(db: Database): Promise<SyncOutcome> {
  const [pendingInspections, pendingSafetyTalks] = await Promise.all([
    listPendingInspections(db),
    listPendingSafetyTalks(db),
  ]);

  if (pendingInspections.length === 0 && pendingSafetyTalks.length === 0) {
    return { hadPending: false, syncedInspections: 0, syncedSafetyTalks: 0 };
  }

  const baseUrl = await resolveApiUrl(db);

  const batch: SyncBatchRequest = {
    inspections: await Promise.all(pendingInspections.map(toInspectionDto)),
    safetyTalks: await Promise.all(pendingSafetyTalks.map(toSafetyTalkDto)),
  };

  const response = await postSyncBatch(baseUrl, batch);

  await Promise.all([
    markInspectionsSynced(
      db,
      pendingInspections.map((item) => item.id),
      response.syncedAt
    ),
    markSafetyTalksSynced(
      db,
      pendingSafetyTalks.map((item) => item.id),
      response.syncedAt
    ),
    setLastSyncAt(db, response.syncedAt),
  ]);

  return {
    hadPending: true,
    syncedInspections: pendingInspections.length,
    syncedSafetyTalks: pendingSafetyTalks.length,
  };
}
