import type { Unit } from '@p2h/shared';
import { useEffect, useState } from 'react';

import { listUnits, useDatabase } from '../models';

export interface UseUnitsResult {
  units: Unit[];
  loading: boolean;
}

/** Loads the local unit catalog (seeded on first launch). */
export function useUnits(): UseUnitsResult {
  const db = useDatabase();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listUnits(db).then((result) => {
      if (active) {
        setUnits(result);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [db]);

  return { units, loading };
}
