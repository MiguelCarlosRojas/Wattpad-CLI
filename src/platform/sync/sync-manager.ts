import { SyncHistoryRecord } from '../../core/types/sync.types';

export class SyncManager {
  private history: SyncHistoryRecord[] = [];
  private nextId = 1;

  public logSync(entityType: string, entityId: string, action: string, status: string, details: string): void {
    const record: SyncHistoryRecord = {
      id: this.nextId++,
      entityType,
      entityId,
      action,
      status,
      details,
      createdAt: new Date().toISOString(),
    };
    this.history.unshift(record); // newest first
  }

  public getHistory(limit: number = 20): SyncHistoryRecord[] {
    return this.history.slice(0, limit);
  }

  public clear(): void {
    this.history = [];
    this.nextId = 1;
  }
}
