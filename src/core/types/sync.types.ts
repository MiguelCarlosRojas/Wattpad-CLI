export type SyncState = 'in_sync' | 'local_ahead' | 'remote_ahead' | 'conflict' | 'error';

export interface DiffResult {
  hasDifferences: boolean;
  localHash: string;
  externalHash: string;
  localLinesCount: number;
  externalLinesCount: number;
  addedLines: number;
  removedLines: number;
  summary: string;
}

export interface SyncOperationResult {
  success: boolean;
  entityType: 'story' | 'chapter';
  entityId: string;
  source: string;
  destination: string;
  status: 'synced' | 'conflict' | 'backed_up' | 'error';
  message: string;
  diff?: DiffResult;
}

export interface SyncHistoryRecord {
  id: number;
  entityType: string;
  entityId: string;
  action: string;
  status: string;
  details: string;
  createdAt: string;
}
