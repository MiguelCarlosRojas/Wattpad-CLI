import { Database } from 'bun:sqlite';

export function runMigrations(db: Database): void {
  // Table for tracking migrations
  db.run(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedVersions = db.query('SELECT version FROM _schema_migrations').all() as Array<{ version: number }>;
  const appliedSet = new Set(appliedVersions.map((v) => v.version));

  const migrations: Array<{ version: number; name: string; sql: string }> = [
    {
      version: 1,
      name: 'initial_schema',
      sql: `
        -- Stories
        CREATE TABLE IF NOT EXISTS stories (
          id TEXT PRIMARY KEY,
          wattpad_id TEXT UNIQUE,
          title TEXT NOT NULL,
          description TEXT,
          cover_url TEXT,
          genre TEXT DEFAULT 'General',
          category TEXT DEFAULT 'Novela',
          tags TEXT DEFAULT '[]',
          language TEXT DEFAULT 'es',
          mature INTEGER DEFAULT 0,
          editor_preference TEXT DEFAULT 'word',
          status TEXT DEFAULT 'draft',
          local_path TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        -- Chapters
        CREATE TABLE IF NOT EXISTS chapters (
          id TEXT PRIMARY KEY,
          story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
          wattpad_id TEXT,
          title TEXT NOT NULL,
          chapter_number INTEGER NOT NULL,
          content TEXT DEFAULT '',
          content_hash TEXT NOT NULL,
          word_count INTEGER DEFAULT 0,
          status TEXT DEFAULT 'draft',
          external_doc_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        -- Chapter Versions
        CREATE TABLE IF NOT EXISTS chapter_versions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
          version_num INTEGER NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          content_hash TEXT NOT NULL,
          source TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        -- External Documents
        CREATE TABLE IF NOT EXISTS external_documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
          chapter_id TEXT REFERENCES chapters(id) ON DELETE CASCADE,
          doc_type TEXT NOT NULL,
          file_path TEXT NOT NULL,
          external_id TEXT,
          last_synced_hash TEXT NOT NULL,
          last_synced_at TEXT NOT NULL
        );

        -- Connections
        CREATE TABLE IF NOT EXISTS connections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          is_connected INTEGER DEFAULT 0,
          account_identifier TEXT,
          base_path TEXT,
          config_json TEXT DEFAULT '{}',
          last_sync_at TEXT
        );

        -- Sync History
        CREATE TABLE IF NOT EXISTS sync_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          action TEXT NOT NULL,
          status TEXT NOT NULL,
          details TEXT,
          created_at TEXT NOT NULL
        );

        -- Settings
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        -- Command History
        CREATE TABLE IF NOT EXISTS command_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          command TEXT NOT NULL,
          executed_at TEXT NOT NULL
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_chapters_story_id ON chapters(story_id);
        CREATE INDEX IF NOT EXISTS idx_chapter_versions_chapter ON chapter_versions(chapter_id);
        CREATE INDEX IF NOT EXISTS idx_ext_docs_story ON external_documents(story_id);
        CREATE INDEX IF NOT EXISTS idx_sync_history_created ON sync_history(created_at);
      `,
    },
  ];

  for (const migration of migrations) {
    if (!appliedSet.has(migration.version)) {
      db.transaction(() => {
        db.run(migration.sql);
        db.run(
          'INSERT INTO _schema_migrations (version, name, applied_at) VALUES (?, ?, ?)',
          [migration.version, migration.name, new Date().toISOString()]
        );
      })();
    }
  }
}
