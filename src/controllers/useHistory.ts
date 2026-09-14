import type { StatusKelayakan, SyncStatus } from '@p2h/shared';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  deleteInspection,
  deletePhotoFile,
  deleteSafetyTalk,
  findInspectionById,
  findSafetyTalkById,
  listInspections,
  listSafetyTalks,
  listUnits,
  useDatabase,
} from '../models';

export interface HistoryEntry {
  kind: 'P2H' | 'P5M';
  id: string;
  title: string;
  person: string;
  /** Form date (`tanggal`), for display. */
  tanggal: string;
  /** ISO 8601 creation timestamp, used only for sorting newest-first. */
  dibuatPada: string;
  syncStatus: SyncStatus;
  /** Verdict pill, P2H rows only. */
  statusKelayakan: StatusKelayakan | null;
}

export interface UseHistoryResult {
  entries: HistoryEntry[];
  loading: boolean;
  refresh: () => Promise<void>;
  /** Hard-deletes a PENDING record and its photo file. No-ops (returns false) if not PENDING. */
  deleteEntry: (kind: 'P2H' | 'P5M', id: string) => Promise<boolean>;
}

/** Combined, newest-first list of every local P2H inspection and P5M safety talk. */
export function useHistory(): UseHistoryResult {
  const db = useDatabase();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [inspections, safetyTalks, units] = await Promise.all([
      listInspections(db),
      listSafetyTalks(db),
      listUnits(db),
    ]);
    const unitById = new Map(units.map((unit) => [unit.id, unit]));

    const inspectionEntries: HistoryEntry[] = inspections.map((inspection) => {
      const unit = unitById.get(inspection.unitId);
      return {
        kind: 'P2H',
        id: inspection.id,
        title: unit ? `${unit.code} — ${unit.name}` : 'Unit tidak diketahui',
        person: inspection.namaOperator,
        tanggal: inspection.tanggal,
        dibuatPada: inspection.dibuatPada,
        syncStatus: inspection.syncStatus,
        statusKelayakan: inspection.statusKelayakan,
      };
    });

    const safetyTalkEntries: HistoryEntry[] = safetyTalks.map((talk) => ({
      kind: 'P5M',
      id: talk.id,
      title: talk.topik,
      person: talk.namaPemimpin,
      tanggal: talk.tanggal,
      dibuatPada: talk.dibuatPada,
      syncStatus: talk.syncStatus,
      statusKelayakan: null,
    }));

    const combined = [...inspectionEntries, ...safetyTalkEntries].sort(
      (a, b) => new Date(b.dibuatPada).getTime() - new Date(a.dibuatPada).getTime()
    );

    setEntries(combined);
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const deleteEntry = useCallback(
    async (kind: 'P2H' | 'P5M', id: string): Promise<boolean> => {
      if (kind === 'P2H') {
        const inspection = await findInspectionById(db, id);
        const deleted = await deleteInspection(db, id);
        if (deleted && inspection) {
          deletePhotoFile(inspection.fotoUri);
        }
        if (deleted) {
          await refresh();
        }
        return deleted;
      }

      const talk = await findSafetyTalkById(db, id);
      const deleted = await deleteSafetyTalk(db, id);
      if (deleted && talk) {
        deletePhotoFile(talk.fotoUri);
      }
      if (deleted) {
        await refresh();
      }
      return deleted;
    },
    [db, refresh]
  );

  return { entries, loading, refresh, deleteEntry };
}
