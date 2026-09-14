import type { Unit, UnitType } from '@p2h/shared';

import type { Database } from './database';

interface UnitRow {
  id: string;
  code: string;
  name: string;
  type: string;
  site: string;
}

function rowToUnit(row: UnitRow): Unit {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type as UnitType,
    site: row.site,
  };
}

/** Lists all known units, ordered by code. */
export async function listUnits(db: Database): Promise<Unit[]> {
  const rows = await db.getAllAsync<UnitRow>('SELECT * FROM units ORDER BY code ASC');
  return rows.map(rowToUnit);
}

/** Looks up a single unit by id, or `null` if it does not exist locally. */
export async function findUnitById(db: Database, id: string): Promise<Unit | null> {
  const row = await db.getFirstAsync<UnitRow>('SELECT * FROM units WHERE id = ?', [id]);
  return row ? rowToUnit(row) : null;
}
