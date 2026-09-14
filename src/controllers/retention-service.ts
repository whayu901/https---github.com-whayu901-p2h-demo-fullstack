import { useEffect } from 'react';

import {
  type Database,
  deleteInspectionsByIds,
  deletePhotoFile,
  deleteSafetyTalksByIds,
  getPhotoFileSizeBytes,
  getRetentionDays,
  listSyncedInspectionsOlderThan,
  listSyncedSafetyTalksOlderThan,
  useDatabase,
} from '../models';

export interface RetentionResult {
  jumlahData: number;
  bytesDibebaskan: number;
}

function cutoffIsoForRetention(retentionDays: number): string {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  return cutoff.toISOString();
}

/**
 * Deletes SYNCED P2H/P5M records (and their photo files) older than
 * `retentionDays`. The server keeps the full history — the device only needs
 * to hold recent data — but PENDING records are never touched here regardless
 * of age, because they have not reached the server yet and deleting them
 * would lose data. Both queries explicitly filter on `sync_status = 'SYNCED'`.
 */
export async function bersihkanDataLama(db: Database, retentionDays: number): Promise<RetentionResult> {
  const cutoffIso = cutoffIsoForRetention(retentionDays);

  const [oldInspections, oldSafetyTalks] = await Promise.all([
    listSyncedInspectionsOlderThan(db, cutoffIso),
    listSyncedSafetyTalksOlderThan(db, cutoffIso),
  ]);

  let bytesDibebaskan = 0;
  for (const inspection of oldInspections) {
    bytesDibebaskan += getPhotoFileSizeBytes(inspection.fotoUri);
    deletePhotoFile(inspection.fotoUri);
  }
  for (const talk of oldSafetyTalks) {
    bytesDibebaskan += getPhotoFileSizeBytes(talk.fotoUri);
    deletePhotoFile(talk.fotoUri);
  }

  await Promise.all([
    deleteInspectionsByIds(
      db,
      oldInspections.map((item) => item.id)
    ),
    deleteSafetyTalksByIds(
      db,
      oldSafetyTalks.map((item) => item.id)
    ),
  ]);

  return { jumlahData: oldInspections.length + oldSafetyTalks.length, bytesDibebaskan };
}

/**
 * Runs `bersihkanDataLama` once, automatically, shortly after the database is
 * ready. Mounted from the root layout so every app launch quietly sweeps out
 * old synced data using the currently configured retention window.
 */
export function useRetentionOnStartup(): void {
  const db = useDatabase();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const retentionDays = await getRetentionDays(db);
        if (active) {
          await bersihkanDataLama(db, retentionDays);
        }
      } catch {
        // A failed cleanup must never block app start; it simply runs again next launch.
      }
    })();
    return () => {
      active = false;
    };
    // Intentionally runs once per database instance (i.e. once per app launch).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);
}
