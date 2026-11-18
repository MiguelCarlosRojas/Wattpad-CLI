import { Database } from 'bun:sqlite';

export class SettingsRepository {
  constructor(private db: Database) {}

  public get(key: string, defaultValue?: string): string | null {
    const row = this.db.query('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | null;
    return row ? row.value : defaultValue ?? null;
  }

  public set(key: string, value: string): void {
    this.db.run(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value]
    );
  }

  public addCommandHistory(command: string): void {
    const trimmed = command.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    this.db.run('INSERT INTO command_history (command, executed_at) VALUES (?, ?)', [trimmed, now]);
  }

  public getCommandHistory(limit: number = 50): string[] {
    const rows = this.db.query(
      'SELECT command FROM command_history ORDER BY id DESC LIMIT ?'
    ).all(limit) as Array<{ command: string }>;

    // Return in chronological order
    return rows.map((r) => r.command).reverse();
  }
}
