export type IntegrationType = 'word' | 'notepad' | 'google' | 'wattpad';

export interface ExternalDocument {
  id: number;
  storyId: string;
  chapterId: string | null;
  docType: IntegrationType;
  filePath: string;
  externalId: string | null;
  lastSyncedHash: string;
  lastSyncedAt: string;
}

export interface ConnectionInfo {
  type: IntegrationType;
  name: string;
  isConnected: boolean;
  accountIdentifier?: string | null;
  basePath?: string | null;
  lastSyncAt?: string | null;
  details?: Record<string, unknown>;
}
