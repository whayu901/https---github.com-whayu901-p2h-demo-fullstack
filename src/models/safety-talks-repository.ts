import type { PesertaP5M, Shift, SyncStatus } from '@p2h/shared';

import type { Database } from './database';
import type { LocalSafetyTalk } from './types';

interface SafetyTalkRow {
  id: string;
  tanggal: string;
  jam_mulai: string;
  shift: string;
  lokasi_area: string;
  departemen_regu: string;
  nama_pemimpin: string;
  nrp_pemimpin: string;
  topik: string;
  uraian_singkat: string;
  potensi_bahaya: string;
  komitmen_pengendalian: string;
  informasi_pengumuman: string;
  peserta: string;
  foto_uri: string | null;
  latitude: number | null;
  longitude: number | null;
  catatan: string;
  dibuat_pada: string;
  sync_status: string;
  synced_at: string | null;
}

function rowToSafetyTalk(row: SafetyTalkRow): LocalSafetyTalk {
  return {
    id: row.id,
    tanggal: row.tanggal,
    jamMulai: row.jam_mulai,
    shift: row.shift as Shift,
    lokasiArea: row.lokasi_area,
    departemenRegu: row.departemen_regu,
    namaPemimpin: row.nama_pemimpin,
    nrpPemimpin: row.nrp_pemimpin,
    topik: row.topik,
    uraianSingkat: row.uraian_singkat,
    potensiBahaya: JSON.parse(row.potensi_bahaya) as string[],
    komitmenPengendalian: JSON.parse(row.komitmen_pengendalian) as string[],
    informasiPengumuman: row.informasi_pengumuman,
    peserta: JSON.parse(row.peserta) as PesertaP5M[],
    fotoUri: row.foto_uri,
    latitude: row.latitude,
    longitude: row.longitude,
    catatan: row.catatan,
    dibuatPada: row.dibuat_pada,
    syncStatus: row.sync_status as SyncStatus,
    syncedAt: row.synced_at,
  };
}

/** Inserts a brand-new safety talk row exactly as given (see notes on `insertInspection`). */
export async function insertSafetyTalk(db: Database, talk: LocalSafetyTalk): Promise<void> {
  await db.runAsync(
    `INSERT INTO safety_talks
      (id, tanggal, jam_mulai, shift, lokasi_area, departemen_regu, nama_pemimpin, nrp_pemimpin,
       topik, uraian_singkat, potensi_bahaya, komitmen_pengendalian, informasi_pengumuman, peserta,
       foto_uri, latitude, longitude, catatan, dibuat_pada, sync_status, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      talk.id,
      talk.tanggal,
      talk.jamMulai,
      talk.shift,
      talk.lokasiArea,
      talk.departemenRegu,
      talk.namaPemimpin,
      talk.nrpPemimpin,
      talk.topik,
      talk.uraianSingkat,
      JSON.stringify(talk.potensiBahaya),
      JSON.stringify(talk.komitmenPengendalian),
      talk.informasiPengumuman,
      JSON.stringify(talk.peserta),
      talk.fotoUri,
      talk.latitude,
      talk.longitude,
      talk.catatan,
      talk.dibuatPada,
      talk.syncStatus,
      talk.syncedAt,
    ]
  );
}

/**
 * Overwrites an existing PENDING safety talk in place. Returns `false` if the
 * record does not exist or is no longer PENDING.
 */
export async function updateSafetyTalk(db: Database, talk: LocalSafetyTalk): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE safety_talks SET
      tanggal = ?, jam_mulai = ?, shift = ?, lokasi_area = ?, departemen_regu = ?,
      nama_pemimpin = ?, nrp_pemimpin = ?, topik = ?, uraian_singkat = ?, potensi_bahaya = ?,
      komitmen_pengendalian = ?, informasi_pengumuman = ?, peserta = ?, foto_uri = ?,
      latitude = ?, longitude = ?, catatan = ?
     WHERE id = ? AND sync_status = 'PENDING'`,
    [
      talk.tanggal,
      talk.jamMulai,
      talk.shift,
      talk.lokasiArea,
      talk.departemenRegu,
      talk.namaPemimpin,
      talk.nrpPemimpin,
      talk.topik,
      talk.uraianSingkat,
      JSON.stringify(talk.potensiBahaya),
      JSON.stringify(talk.komitmenPengendalian),
      talk.informasiPengumuman,
      JSON.stringify(talk.peserta),
      talk.fotoUri,
      talk.latitude,
      talk.longitude,
      talk.catatan,
      talk.id,
    ]
  );
  return result.changes > 0;
}

/**
 * Hard-deletes a safety talk, but only while it is still PENDING. Returns
 * `false` if the record does not exist or has already been synced.
 */
export async function deleteSafetyTalk(db: Database, id: string): Promise<boolean> {
  const result = await db.runAsync("DELETE FROM safety_talks WHERE id = ? AND sync_status = 'PENDING'", [
    id,
  ]);
  return result.changes > 0;
}

/** Deletes safety talks by id regardless of sync status. Used by retention cleanup. */
export async function deleteSafetyTalksByIds(db: Database, ids: readonly string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  const placeholders = ids.map(() => '?').join(', ');
  await db.runAsync(`DELETE FROM safety_talks WHERE id IN (${placeholders})`, [...ids]);
}

/** Lists every locally stored safety talk, newest first. */
export async function listSafetyTalks(db: Database): Promise<LocalSafetyTalk[]> {
  const rows = await db.getAllAsync<SafetyTalkRow>('SELECT * FROM safety_talks ORDER BY dibuat_pada DESC');
  return rows.map(rowToSafetyTalk);
}

/** Lists only safety talks that have not been synced yet. */
export async function listPendingSafetyTalks(db: Database): Promise<LocalSafetyTalk[]> {
  const rows = await db.getAllAsync<SafetyTalkRow>(
    "SELECT * FROM safety_talks WHERE sync_status = 'PENDING' ORDER BY dibuat_pada ASC"
  );
  return rows.map(rowToSafetyTalk);
}

/**
 * Lists SYNCED safety talks whose `synced_at` is older than `cutoffIso`.
 * Never returns PENDING rows regardless of age.
 */
export async function listSyncedSafetyTalksOlderThan(
  db: Database,
  cutoffIso: string
): Promise<LocalSafetyTalk[]> {
  const rows = await db.getAllAsync<SafetyTalkRow>(
    "SELECT * FROM safety_talks WHERE sync_status = 'SYNCED' AND synced_at IS NOT NULL AND synced_at < ?",
    [cutoffIso]
  );
  return rows.map(rowToSafetyTalk);
}

/** Counts pending safety talks, for the Home screen badge. */
export async function countPendingSafetyTalks(db: Database): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM safety_talks WHERE sync_status = 'PENDING'"
  );
  return row?.count ?? 0;
}

/** Counts synced safety talks, for the Pengaturan storage summary. */
export async function countSyncedSafetyTalks(db: Database): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM safety_talks WHERE sync_status = 'SYNCED'"
  );
  return row?.count ?? 0;
}

/** Looks up a single safety talk by id. */
export async function findSafetyTalkById(db: Database, id: string): Promise<LocalSafetyTalk | null> {
  const row = await db.getFirstAsync<SafetyTalkRow>('SELECT * FROM safety_talks WHERE id = ?', [id]);
  return row ? rowToSafetyTalk(row) : null;
}

/** Marks the given safety talk ids as `SYNCED` after a successful sync push. */
export async function markSafetyTalksSynced(
  db: Database,
  ids: readonly string[],
  syncedAtIso: string
): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  await db.withTransactionAsync(async () => {
    for (const id of ids) {
      await db.runAsync("UPDATE safety_talks SET sync_status = 'SYNCED', synced_at = ? WHERE id = ?", [
        syncedAtIso,
        id,
      ]);
    }
  });
}
