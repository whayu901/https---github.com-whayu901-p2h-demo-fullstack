import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  SyncError,
  countPendingInspections,
  countPendingSafetyTalks,
  getLastSyncAt,
  useDatabase,
} from '../models';
import { syncPendingRecords } from './sync-service';

export interface SyncNotice {
  kind: 'error' | 'info';
  text: string;
}

export interface UseSyncStatusResult {
  pendingCount: number;
  lastSyncAt: string | null;
  syncing: boolean;
  notice: SyncNotice | null;
  refresh: () => Promise<void>;
  sync: () => Promise<void>;
}

/** Home screen sync card: pending count, last sync time, and the "Sinkronisasi" action. */
export function useSyncStatus(): UseSyncStatusResult {
  const db = useDatabase();
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<SyncNotice | null>(null);

  const refresh = useCallback(async () => {
    const [inspectionCount, safetyTalkCount, storedLastSyncAt] = await Promise.all([
      countPendingInspections(db),
      countPendingSafetyTalks(db),
      getLastSyncAt(db),
    ]);
    setPendingCount(inspectionCount + safetyTalkCount);
    setLastSyncAt(storedLastSyncAt);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const sync = useCallback(async () => {
    setSyncing(true);
    setNotice(null);
    try {
      const outcome = await syncPendingRecords(db);
      setNotice(
        outcome.hadPending
          ? null
          : { kind: 'info', text: 'Tidak ada data tertunda' }
      );
    } catch (error) {
      const text =
        error instanceof SyncError
          ? error.message
          : 'Gagal sinkronisasi: server tidak dapat dijangkau';
      setNotice({ kind: 'error', text });
    } finally {
      await refresh();
      setSyncing(false);
    }
  }, [db, refresh]);

  return { pendingCount, lastSyncAt, syncing, notice, refresh, sync };
}
