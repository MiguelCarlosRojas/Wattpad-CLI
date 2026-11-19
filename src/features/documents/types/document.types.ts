export type EditorPreference = 'word' | 'notepad' | 'google';

export interface DocumentRecord {
  id: string;
  storyId: string;
  chapterId?: string | null;
  docType: 'word' | 'notepad' | 'google';
  filePath?: string | null;
  externalId?: string | null;
  googleDocId?: string | null;
  title?: string;
  lastSyncedHash?: string | null;
  lastSyncedAt?: string | null;
  lastHash?: string | null;
  updatedAt: string;
}
