import { SEED_UNITS, getChecklist, hitungStatusKelayakan } from '@p2h/shared';
import * as Crypto from 'expo-crypto';

import {
  DEFAULT_API_URL,
  DEFAULT_RETENTION_DAYS,
  type Database,
  type LocalInspection,
  clearApiUrlOverride as clearApiUrlOverrideInMeta,
  clearPhotosDir,
  countPendingInspections,
  countPendingSafetyTalks,
  countSyncedInspections,
  countSyncedSafetyTalks,
  getApiUrlOverride,
  getDatabaseFileSizeBytes,
  getPhotosDirSizeBytes,
  getRetentionDays,
  insertInspection,
  resetAllData,
  resetSyncAndRetentionMeta,
  setApiUrlOverride as setApiUrlOverrideInMeta,
  setRetentionDays as setRetentionDaysInMeta,
  writeDemoPhoto,
} from '../models';

const DEMO_DATA_AGE_DAYS = 10;

/** The API URL actually used at runtime: a user override, if set, else the build-time default. */
export async function resolveApiUrl(db: Database): Promise<string> {
  const override = await getApiUrlOverride(db);
  return override && override.trim().length > 0 ? override.trim() : DEFAULT_API_URL;
}

/** Saves a user-provided API URL override. Rejects blank input. */
export async function saveApiUrlOverride(db: Database, url: string): Promise<void> {
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    throw new Error('Alamat server tidak boleh kosong.');
  }
  await setApiUrlOverrideInMeta(db, trimmed);
}

/** Clears the override so the app goes back to using the build-time `.env` default. */
export async function resetApiUrlToDefault(db: Database): Promise<void> {
  await clearApiUrlOverrideInMeta(db);
}

export interface StorageSummary {
  databaseBytes: number;
  photosBytes: number;
  totalBytes: number;
  pendingCount: number;
  syncedCount: number;
  retentionDays: number;
}

/** Snapshot of on-device storage usage and record counts, for the Pengaturan screen. */
export async function getStorageSummary(db: Database): Promise<StorageSummary> {
  const [pendingInspections, pendingSafetyTalks, syncedInspections, syncedSafetyTalks, retentionDays] =
    await Promise.all([
      countPendingInspections(db),
      countPendingSafetyTalks(db),
      countSyncedInspections(db),
      countSyncedSafetyTalks(db),
      getRetentionDays(db),
    ]);

  const databaseBytes = getDatabaseFileSizeBytes();
  const photosBytes = getPhotosDirSizeBytes();

  return {
    databaseBytes,
    photosBytes,
    totalBytes: databaseBytes + photosBytes,
    pendingCount: pendingInspections + pendingSafetyTalks,
    syncedCount: syncedInspections + syncedSafetyTalks,
    retentionDays,
  };
}

/** Persists the retention window chosen in Pengaturan (7 / 14 / 30 hari). */
export async function saveRetentionDays(db: Database, days: number): Promise<void> {
  await setRetentionDaysInMeta(db, days);
}

/**
 * "Reset semua data lokal": wipes every local P2H/P5M record and photo, and
 * resets sync/retention bookkeeping — but keeps any API URL override, since
 * that is a device/network setting, not app data.
 */
export async function resetAllLocalData(db: Database): Promise<void> {
  await resetAllData(db);
  clearPhotosDir();
  await resetSyncAndRetentionMeta(db);
}

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function dateOnlyDaysAgo(days: number): string {
  return isoDaysAgo(days).slice(0, 10);
}

/**
 * "Buat contoh data lama (10 hari)": inserts one SYNCED P2H (with a dummy
 * photo file) and one PENDING P2H, both dated `DEMO_DATA_AGE_DAYS` days ago,
 * so the retention feature can be exercised by hand: restart the app (or run
 * "Bersihkan data lama") and confirm only the SYNCED one + its photo disappear.
 */
export async function seedOldDemoData(db: Database): Promise<void> {
  const unit = SEED_UNITS[0];
  const items = getChecklist(unit.type).map((item) => ({ ...item, hasil: 'NORMAL' as const }));
  const { status } = hitungStatusKelayakan(items);
  const dibuatPada = isoDaysAgo(DEMO_DATA_AGE_DAYS);
  const tanggal = dateOnlyDaysAgo(DEMO_DATA_AGE_DAYS);

  const base: Omit<LocalInspection, 'id' | 'syncStatus' | 'syncedAt' | 'fotoUri'> = {
    unitId: unit.id,
    namaOperator: 'Contoh Operator Lama',
    nrp: '000000',
    tanggal,
    shift: 'PAGI',
    lokasiKerja: unit.site,
    hmKmAwal: 1000,
    hmKmAkhir: null,
    items,
    statusKelayakan: status,
    pernyataanOperator: true,
    catatanOperator: 'Data contoh untuk pengujian retensi.',
    rekomendasiMekanik: null,
    keputusanPengawas: null,
    latitude: null,
    longitude: null,
    dibuatPada,
  };

  const syncedPhotoUri = writeDemoPhoto();

  await insertInspection(db, {
    ...base,
    id: Crypto.randomUUID(),
    fotoUri: syncedPhotoUri,
    syncStatus: 'SYNCED',
    syncedAt: dibuatPada,
  });

  await insertInspection(db, {
    ...base,
    id: Crypto.randomUUID(),
    fotoUri: null,
    syncStatus: 'PENDING',
    syncedAt: null,
  });
}

export { DEFAULT_RETENTION_DAYS };
