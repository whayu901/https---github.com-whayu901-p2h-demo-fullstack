import { File, Paths } from 'expo-file-system';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import type { ReactNode } from 'react';

import { migrateDatabase } from './schema';

/** The name of the on-device SQLite database file. */
export const DATABASE_NAME = 'p2h.db';

/** Alias so the rest of the app never needs to import `expo-sqlite` types directly. */
export type Database = SQLiteDatabase;

/**
 * Access to the open database. This is the only place other layers may obtain
 * a `Database` instance from — controllers call this, never `expo-sqlite` directly.
 */
export function useDatabase(): Database {
  return useSQLiteContext();
}

export interface DatabaseProviderProps {
  children: ReactNode;
}

/**
 * Opens (and migrates, on first launch) the local database, then makes it
 * available to descendants via `useDatabase`. Mount once, at the app root.
 */
export function DatabaseProvider({ children }: DatabaseProviderProps) {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDatabase}>
      {children}
    </SQLiteProvider>
  );
}

/**
 * Best-effort size (in bytes) of the SQLite database file on disk, for the
 * Pengaturan storage summary. expo-sqlite stores its databases under
 * `<documentDirectory>/SQLite/`; if that file cannot be read for any reason
 * this returns 0 rather than throwing.
 */
export function getDatabaseFileSizeBytes(): number {
  try {
    const file = new File(Paths.document, 'SQLite', DATABASE_NAME);
    return file.exists ? file.size : 0;
  } catch {
    return 0;
  }
}
