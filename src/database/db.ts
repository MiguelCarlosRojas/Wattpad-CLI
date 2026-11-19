import { Database } from 'bun:sqlite';
import { defaultConfig, ensureDirectories } from '../config/config';
import { runMigrations } from './migrations';

let dbInstance: Database | null = null;

export function getDatabase(customPath?: string): Database {
  if (customPath) {
    const db = new Database(customPath, { create: true });
    db.run('PRAGMA foreign_keys = ON;');
    db.run('PRAGMA journal_mode = WAL;');
    runMigrations(db);
    return db;
  }

  if (dbInstance) {
    return dbInstance;
  }

  ensureDirectories();
  const dbFile = defaultConfig.dbPath;

  dbInstance = new Database(dbFile, { create: true });
  dbInstance.run('PRAGMA foreign_keys = ON;');
  dbInstance.run('PRAGMA journal_mode = WAL;');

  runMigrations(dbInstance);

  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
