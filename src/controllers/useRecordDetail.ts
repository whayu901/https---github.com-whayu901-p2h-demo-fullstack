import { type HasilKelayakan, type Unit, hitungPesertaHadir, hitungStatusKelayakan } from '@p2h/shared';
import { useCallback, useEffect, useState } from 'react';

import {
  type LocalInspection,
  type LocalSafetyTalk,
  deleteInspection,
  deletePhotoFile,
  deleteSafetyTalk,
  findInspectionById,
  findSafetyTalkById,
  findUnitById,
  useDatabase,
} from '../models';

export type RecordKind = 'p2h' | 'p5m';

export type DetailRecord =
  | { kind: 'p2h'; inspection: LocalInspection; unit: Unit | null; verdict: HasilKelayakan }
  | { kind: 'p5m'; talk: LocalSafetyTalk; jumlahHadir: number };

export interface UseRecordDetailResult {
  record: DetailRecord | null;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Hard-deletes this record and its photo file. Returns `false` if it is no longer PENDING. */
  deleteRecord: () => Promise<boolean>;
}

/** Loads a single P2H inspection or P5M safety talk for the read-only detail screen. */
export function useRecordDetail(kind: RecordKind, id: string): UseRecordDetailResult {
  const db = useDatabase();
  const [record, setRecord] = useState<DetailRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (kind === 'p2h') {
      const inspection = await findInspectionById(db, id);
      const unit = inspection ? await findUnitById(db, inspection.unitId) : null;
      setRecord(
        inspection
          ? { kind: 'p2h', inspection, unit, verdict: hitungStatusKelayakan(inspection.items) }
          : null
      );
      setLoading(false);
      return;
    }

    const talk = await findSafetyTalkById(db, id);
    setRecord(talk ? { kind: 'p5m', talk, jumlahHadir: hitungPesertaHadir(talk.peserta) } : null);
    setLoading(false);
  }, [db, id, kind]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      if (active) {
        await load();
      }
    })();
    return () => {
      active = false;
    };
  }, [load]);

  const deleteRecord = useCallback(async (): Promise<boolean> => {
    if (!record) {
      return false;
    }
    if (record.kind === 'p2h') {
      const deleted = await deleteInspection(db, record.inspection.id);
      if (deleted) {
        deletePhotoFile(record.inspection.fotoUri);
      }
      return deleted;
    }
    const deleted = await deleteSafetyTalk(db, record.talk.id);
    if (deleted) {
      deletePhotoFile(record.talk.fotoUri);
    }
    return deleted;
  }, [db, record]);

  return { record, loading, refresh: load, deleteRecord };
}
