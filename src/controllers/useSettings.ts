import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { RETENTION_DAYS_OPTIONS, useDatabase } from '../models';
import { bersihkanDataLama } from './retention-service';
import {
  type StorageSummary,
  getStorageSummary,
  resetAllLocalData,
  resolveApiUrl,
  saveApiUrlOverride,
  saveRetentionDays,
  seedOldDemoData,
  resetApiUrlToDefault,
} from './settings-service';

export { RETENTION_DAYS_OPTIONS };

export interface RetentionRunResult {
  jumlahData: number;
  megabytesDibebaskan: number;
}

export interface UseSettingsResult {
  apiUrlInput: string;
  setApiUrlInput: (value: string) => void;
  effectiveApiUrl: string;
  saveApiUrl: () => Promise<{ ok: true } | { ok: false; message: string }>;
  useDefaultUrl: () => Promise<void>;
  storage: StorageSummary | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setRetentionDays: (days: number) => Promise<void>;
  runRetentionNow: () => Promise<RetentionRunResult>;
  seedOldDemo: () => Promise<void>;
  resetAll: () => Promise<void>;
}

const BYTES_PER_MB = 1024 * 1024;

/** Business logic for the Pengaturan screen: server URL, storage, retention, and demo actions. */
export function useSettings(): UseSettingsResult {
  const db = useDatabase();
  const [apiUrlInput, setApiUrlInput] = useState('');
  const [effectiveApiUrl, setEffectiveApiUrl] = useState('');
  const [storage, setStorage] = useState<StorageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [url, summary] = await Promise.all([resolveApiUrl(db), getStorageSummary(db)]);
    setEffectiveApiUrl(url);
    setApiUrlInput(url);
    setStorage(summary);
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const saveApiUrl = useCallback(async (): Promise<{ ok: true } | { ok: false; message: string }> => {
    try {
      await saveApiUrlOverride(db, apiUrlInput);
      await refresh();
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : 'Gagal menyimpan alamat server.' };
    }
  }, [apiUrlInput, db, refresh]);

  const useDefaultUrl = useCallback(async () => {
    await resetApiUrlToDefault(db);
    await refresh();
  }, [db, refresh]);

  const setRetentionDays = useCallback(
    async (days: number) => {
      await saveRetentionDays(db, days);
      await refresh();
    },
    [db, refresh]
  );

  const runRetentionNow = useCallback(async (): Promise<RetentionRunResult> => {
    const retentionDays = storage?.retentionDays ?? RETENTION_DAYS_OPTIONS[0];
    const result = await bersihkanDataLama(db, retentionDays);
    await refresh();
    return {
      jumlahData: result.jumlahData,
      megabytesDibebaskan: result.bytesDibebaskan / BYTES_PER_MB,
    };
  }, [db, refresh, storage?.retentionDays]);

  const seedOldDemo = useCallback(async () => {
    await seedOldDemoData(db);
    await refresh();
  }, [db, refresh]);

  const resetAll = useCallback(async () => {
    await resetAllLocalData(db);
    await refresh();
  }, [db, refresh]);

  return {
    apiUrlInput,
    setApiUrlInput,
    effectiveApiUrl,
    saveApiUrl,
    useDefaultUrl,
    storage,
    loading,
    refresh,
    setRetentionDays,
    runRetentionNow,
    seedOldDemo,
    resetAll,
  };
}
