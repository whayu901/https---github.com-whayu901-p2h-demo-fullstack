import { SEED_UNITS } from '@p2h/shared';

import type { Database } from './database';

/**
 * Bumped whenever the on-device table shape changes. Compared against
 * `PRAGMA user_version` on every launch so old installs get migrated.
 */
export const DATABASE_VERSION = 2;

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  site TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY NOT NULL,
  unit_id TEXT NOT NULL,
  nama_operator TEXT NOT NULL,
  nrp TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  shift TEXT NOT NULL,
  lokasi_kerja TEXT NOT NULL,
  hm_km_awal REAL NOT NULL,
  hm_km_akhir REAL,
  items TEXT NOT NULL,
  status_kelayakan TEXT NOT NULL,
  pernyataan_operator INTEGER NOT NULL,
  catatan_operator TEXT NOT NULL,
  rekomendasi_mekanik TEXT,
  keputusan_pengawas TEXT,
  foto_uri TEXT,
  latitude REAL,
  longitude REAL,
  dibuat_pada TEXT NOT NULL,
  sync_status TEXT NOT NULL,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS safety_talks (
  id TEXT PRIMARY KEY NOT NULL,
  tanggal TEXT NOT NULL,
  jam_mulai TEXT NOT NULL,
  shift TEXT NOT NULL,
  lokasi_area TEXT NOT NULL,
  departemen_regu TEXT NOT NULL,
  nama_pemimpin TEXT NOT NULL,
  nrp_pemimpin TEXT NOT NULL,
  topik TEXT NOT NULL,
  uraian_singkat TEXT NOT NULL,
  potensi_bahaya TEXT NOT NULL,
  komitmen_pengendalian TEXT NOT NULL,
  informasi_pengumuman TEXT NOT NULL,
  peserta TEXT NOT NULL,
  foto_uri TEXT,
  latitude REAL,
  longitude REAL,
  catatan TEXT NOT NULL,
  dibuat_pada TEXT NOT NULL,
  sync_status TEXT NOT NULL,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

const DROP_TABLES_SQL = `
DROP TABLE IF EXISTS inspections;
DROP TABLE IF EXISTS safety_talks;
DROP TABLE IF EXISTS units;
`;

/** Seeds the fixed unit catalog on first launch, if the table is empty. */
async function seedUnitsIfEmpty(db: Database): Promise<void> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM units');
  if (row !== null && row.count > 0) {
    return;
  }

  await db.withTransactionAsync(async () => {
    for (const unit of SEED_UNITS) {
      await db.runAsync(
        'INSERT INTO units (id, code, name, type, site) VALUES (?, ?, ?, ?, ?)',
        [unit.id, unit.code, unit.name, unit.type, unit.site]
      );
    }
  });
}

/**
 * Creates (or migrates) tables and seeds reference data. Passed as the
 * `onInit` handler to `SQLiteProvider` so it runs once before the app renders.
 *
 * This is a demo app with no real users yet, so "migration" is intentionally
 * destructive: any schema version bump just drops and recreates the P2H/P5M
 * tables instead of writing an `ALTER TABLE` migration path. `meta` is never
 * dropped so a stored `api_url_override` survives an app update.
 */
export async function migrateDatabase(db: Database): Promise<void> {
  await db.execAsync('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);');

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < DATABASE_VERSION) {
    await db.execAsync(DROP_TABLES_SQL);
    await db.execAsync(CREATE_TABLES_SQL);
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  } else {
    await db.execAsync(CREATE_TABLES_SQL);
  }

  await seedUnitsIfEmpty(db);
}

/**
 * Wipes every inspection, safety talk, and unit, then reseeds the unit
 * catalog. Used by the "Reset semua data lokal" demo action. Does not touch
 * `meta` — callers that want to reset sync/retention state must do so
 * explicitly (see `meta-repository.ts`) so an `api_url_override` can be kept.
 */
export async function resetAllData(db: Database): Promise<void> {
  await db.execAsync(DROP_TABLES_SQL);
  await db.execAsync(CREATE_TABLES_SQL);
  await seedUnitsIfEmpty(db);
}
