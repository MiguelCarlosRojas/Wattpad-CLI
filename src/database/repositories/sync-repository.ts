import { Database } from 'bun:sqlite';
import { SyncHistoryRecord } from '../../types/sync.types';

export class SyncRepository {
  constructor(private db: Database) {}

  public logSync(entityType: string, entityId: string, action: string, status: string, details: string): void {
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO sync_history (entity_type, entity_id, action, status, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [entityType, entityId, action, status, details, now]
    );
  }

  public getHistory(limit: number = 20): SyncHistoryRecord[] {
    const rows = this.db.query(
      'SELECT * FROM sync_history ORDER BY created_at DESC LIMIT ?'
    ).all(limit) as Array<Record<string, any>>;

    return rows.map((r) => ({
      id: r.id,
      entityType: r.entity_type,
      entityId: r.entity_id,
      action: r.action,
      status: r.status,
      details: r.details,
      createdAt: r.created_at,
    }));
  }
}
