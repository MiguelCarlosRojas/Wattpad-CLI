import { Database } from 'bun:sqlite';
import { ConnectionInfo, IntegrationType } from '../../types/integration.types';

export class ConnectionRepository {
  constructor(private db: Database) {
    this.ensureDefaults();
  }

  private ensureDefaults(): void {
    const defaultTypes: Array<{ type: IntegrationType; name: string }> = [
      { type: 'wattpad', name: 'Wattpad' },
      { type: 'word', name: 'Microsoft Word (.docx)' },
      { type: 'notepad', name: 'Bloc de Notas (.txt)' },
      { type: 'google', name: 'Google Docs / Drive' },
    ];

    for (const item of defaultTypes) {
      this.db.run(
        `INSERT OR IGNORE INTO connections (type, name, is_connected, config_json)
         VALUES (?, ?, 0, '{}')`,
        [item.type, item.name]
      );
    }
  }

  public getStatus(type: IntegrationType): ConnectionInfo {
    const row = this.db.query('SELECT * FROM connections WHERE type = ?').get(type) as Record<string, any> | null;
    if (!row) {
      return {
        type,
        name: type,
        isConnected: false,
      };
    }
    return this.mapRow(row);
  }

  public setConnected(
    type: IntegrationType,
    name: string,
    isConnected: boolean,
    accountIdentifier?: string | null,
    basePath?: string | null,
    config?: Record<string, unknown>
  ): void {
    const now = new Date().toISOString();
    const configJson = config ? JSON.stringify(config) : '{}';

    this.db.run(
      `INSERT INTO connections (type, name, is_connected, account_identifier, base_path, config_json, last_sync_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(type) DO UPDATE SET
         name = excluded.name,
         is_connected = excluded.is_connected,
         account_identifier = excluded.account_identifier,
         base_path = excluded.base_path,
         config_json = excluded.config_json,
         last_sync_at = excluded.last_sync_at`,
      [
        type,
        name,
        isConnected ? 1 : 0,
        accountIdentifier || null,
        basePath || null,
        configJson,
        isConnected ? now : null,
      ]
    );
  }

  public getAll(): ConnectionInfo[] {
    const rows = this.db.query('SELECT * FROM connections').all() as Array<Record<string, any>>;
    return rows.map((r) => this.mapRow(r));
  }

  private mapRow(r: Record<string, any>): ConnectionInfo {
    let details: Record<string, unknown> = {};
    try {
      details = JSON.parse(r.config_json || '{}');
    } catch {
      details = {};
    }

    return {
      type: r.type as IntegrationType,
      name: r.name,
      isConnected: Boolean(r.is_connected),
      accountIdentifier: r.account_identifier,
      basePath: r.base_path,
      lastSyncAt: r.last_sync_at,
      details,
    };
  }
}
