import type { HasilItemP2H, Shift, StatusKelayakan, SyncStatus } from '@p2h/shared';

import type { Database } from './database';
import type { LocalInspection } from './types';

interface InspectionRow {
  id: string;
  unit_id: string;
  nama_operator: string;
  nrp: string;
  tanggal: string;
  shift: string;
  lokasi_kerja: string;
  hm_km_awal: number;
  hm_km_akhir: number | null;
  items: string;
  status_kelayakan: string;
  pernyataan_operator: number;
  catatan_operator: string;
  rekomendasi_mekanik: string | null;
  keputusan_pengawas: string | null;
  foto_uri: string | null;
  latitude: number | null;
  longitude: number | null;
  dibuat_pada: string;
  sync_status: string;
  synced_at: string | null;
}

function rowToInspection(row: InspectionRow): LocalInspection {
  return {
    id: row.id,
    unitId: row.unit_id,
    namaOperator: row.nama_operator,
    nrp: row.nrp,
    tanggal: row.tanggal,
    shift: row.shift as Shift,
    lokasiKerja: row.lokasi_kerja,
    hmKmAwal: row.hm_km_awal,
    hmKmAkhir: row.hm_km_akhir,
    items: JSON.parse(row.items) as HasilItemP2H[],
    statusKelayakan: row.status_kelayakan as StatusKelayakan,
    pernyataanOperator: row.pernyataan_operator === 1,
    catatanOperator: row.catatan_operator,
    rekomendasiMekanik: row.rekomendasi_mekanik,
    keputusanPengawas: row.keputusan_pengawas,
    fotoUri: row.foto_uri,
    latitude: row.latitude,
    longitude: row.longitude,
    dibuatPada: row.dibuat_pada,
    syncStatus: row.sync_status as SyncStatus,
    syncedAt: row.synced_at,
  };
}

/**
 * Inserts a brand-new inspection row exactly as given. Callers creating a
 * fresh inspection from the form should always pass `syncStatus: 'PENDING'`;
 * the one exception is the "Buat contoh data lama" demo seeding action, which
 * inserts pre-synced rows directly to exercise retention.
 */
export async function insertInspection(db: Database, inspection: LocalInspection): Promise<void> {
  await db.runAsync(
    `INSERT INTO inspections
      (id, unit_id, nama_operator, nrp, tanggal, shift, lokasi_kerja, hm_km_awal, hm_km_akhir,
       items, status_kelayakan, pernyataan_operator, catatan_operator, rekomendasi_mekanik,
       keputusan_pengawas, foto_uri, latitude, longitude, dibuat_pada, sync_status, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      inspection.id,
      inspection.unitId,
      inspection.namaOperator,
      inspection.nrp,
      inspection.tanggal,
      inspection.shift,
      inspection.lokasiKerja,
      inspection.hmKmAwal,
      inspection.hmKmAkhir,
      JSON.stringify(inspection.items),
      inspection.statusKelayakan,
      inspection.pernyataanOperator ? 1 : 0,
      inspection.catatanOperator,
      inspection.rekomendasiMekanik,
      inspection.keputusanPengawas,
      inspection.fotoUri,
      inspection.latitude,
      inspection.longitude,
      inspection.dibuatPada,
      inspection.syncStatus,
      inspection.syncedAt,
    ]
  );
}

/**
 * Overwrites an existing PENDING inspection in place — a true UPDATE, never a
 * delete-and-reinsert, so the id (and any dashboard reference to it) survives.
 * Returns `false` (0 rows changed) if the record does not exist or is no
 * longer PENDING (already synced records are immutable on-device).
 */
export async function updateInspection(db: Database, inspection: LocalInspection): Promise<boolean> {
  const result = await db.runAsync(
    `UPDATE inspections SET
      unit_id = ?, nama_operator = ?, nrp = ?, tanggal = ?, shift = ?, lokasi_kerja = ?,
      hm_km_awal = ?, hm_km_akhir = ?, items = ?, status_kelayakan = ?, pernyataan_operator = ?,
      catatan_operator = ?, rekomendasi_mekanik = ?, keputusan_pengawas = ?, foto_uri = ?,
      latitude = ?, longitude = ?
     WHERE id = ? AND sync_status = 'PENDING'`,
    [
      inspection.unitId,
      inspection.namaOperator,
      inspection.nrp,
      inspection.tanggal,
      inspection.shift,
      inspection.lokasiKerja,
      inspection.hmKmAwal,
      inspection.hmKmAkhir,
      JSON.stringify(inspection.items),
      inspection.statusKelayakan,
      inspection.pernyataanOperator ? 1 : 0,
      inspection.catatanOperator,
      inspection.rekomendasiMekanik,
      inspection.keputusanPengawas,
      inspection.fotoUri,
      inspection.latitude,
      inspection.longitude,
      inspection.id,
    ]
  );
  return result.changes > 0;
}

/**
 * Hard-deletes an inspection, but only while it is still PENDING. Returns
 * `false` if the record does not exist or has already been synced.
 */
export async function deleteInspection(db: Database, id: string): Promise<boolean> {
  const result = await db.runAsync("DELETE FROM inspections WHERE id = ? AND sync_status = 'PENDING'", [
    id,
  ]);
  return result.changes > 0;
}

/** Deletes inspections by id regardless of sync status. Used by retention cleanup. */
export async function deleteInspectionsByIds(db: Database, ids: readonly string[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  const placeholders = ids.map(() => '?').join(', ');
  await db.runAsync(`DELETE FROM inspections WHERE id IN (${placeholders})`, [...ids]);
}

/** Lists every locally stored inspection, newest first. */
export async function listInspections(db: Database): Promise<LocalInspection[]> {
  const rows = await db.getAllAsync<InspectionRow>('SELECT * FROM inspections ORDER BY dibuat_pada DESC');
  return rows.map(rowToInspection);
}

/** Lists only inspections that have not been synced yet. */
export async function listPendingInspections(db: Database): Promise<LocalInspection[]> {
  const rows = await db.getAllAsync<InspectionRow>(
    "SELECT * FROM inspections WHERE sync_status = 'PENDING' ORDER BY dibuat_pada ASC"
  );
  return rows.map(rowToInspection);
}

/**
 * Lists SYNCED inspections whose `synced_at` is older than `cutoffIso`. Never
 * returns PENDING rows regardless of age — retention only ever touches data
 * the server already has a copy of.
 */
export async function listSyncedInspectionsOlderThan(
  db: Database,
  cutoffIso: string
): Promise<LocalInspection[]> {
  const rows = await db.getAllAsync<InspectionRow>(
    "SELECT * FROM inspections WHERE sync_status = 'SYNCED' AND synced_at IS NOT NULL AND synced_at < ?",
    [cutoffIso]
  );
  return rows.map(rowToInspection);
}

/** Counts pending inspections, for the Home screen badge. */
export async function countPendingInspections(db: Database): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM inspections WHERE sync_status = 'PENDING'"
  );
  return row?.count ?? 0;
}

/** Counts synced inspections, for the Pengaturan storage summary. */
export async function countSyncedInspections(db: Database): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM inspections WHERE sync_status = 'SYNCED'"
  );
  return row?.count ?? 0;
}

/** Looks up a single inspection by id. */
export async function findInspectionById(db: Database, id: string): Promise<LocalInspection | null> {
  const row = await db.getFirstAsync<InspectionRow>('SELECT * FROM inspections WHERE id = ?', [id]);
  return row ? rowToInspection(row) : null;
}

/** Marks the given inspection ids as `SYNCED` after a successful sync push. */
export async function markInspectionsSynced(
  db: Database,
  ids: readonly string[],
  syncedAtIso: string
): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  await db.withTransactionAsync(async () => {
    for (const id of ids) {
      await db.runAsync("UPDATE inspections SET sync_status = 'SYNCED', synced_at = ? WHERE id = ?", [
        syncedAtIso,
        id,
      ]);
    }
  });
}
