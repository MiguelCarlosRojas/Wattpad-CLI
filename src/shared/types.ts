export type StoryStatus = 'draft' | 'pending' | 'synced' | 'published' | 'error';
export type EditorPreference = 'word' | 'notepad' | 'google';
export type IntegrationType = 'word' | 'notepad' | 'google' | 'wattpad';
export type ChapterStatus = 'draft' | 'pending' | 'synced' | 'published' | 'error';
export type SyncState = 'in_sync' | 'local_ahead' | 'remote_ahead' | 'conflict' | 'error';

export interface WattpadUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  avatar: string | null;
  description: string;
  numStories: number;
  numFollowing: number;
  numFollowers: number;
  numLists: number;
  votesReceived: number;
  created: string;
}

export interface Story {
  id: string; // e.g. "NOV-0001"
  userId: string;
  wattpadId: string | null;
  title: string;
  description: string;
  coverUrl: string | null;
  genre: string;
  category: string;
  tags: string[];
  language: string;
  mature: boolean;
  editorPreference: EditorPreference;
  status: StoryStatus;
  localPath?: string | null;
  cloudStorageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoryDto {
  title: string;
  description?: string;
  coverUrl?: string;
  genre?: string;
  category?: string;
  tags?: string[];
  language?: string;
  mature?: boolean;
  editorPreference?: EditorPreference;
  status?: StoryStatus;
}

export interface UpdateStoryDto {
  title?: string;
  description?: string;
  coverUrl?: string | null;
  genre?: string;
  category?: string;
  tags?: string[];
  language?: string;
  mature?: boolean;
  editorPreference?: EditorPreference;
  status?: StoryStatus;
  wattpadId?: string | null;
}

export interface Chapter {
  id: string; // e.g. "CAP-0001"
  storyId: string;
  wattpadId: string | null;
  title: string;
  chapterNumber: number;
  content: string;
  contentHash: string; // SHA-256
  wordCount: number;
  status: ChapterStatus;
  externalDocId: string | null;
  cloudDocUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChapterDto {
  storyId: string;
  title: string;
  chapterNumber?: number;
  content?: string;
  status?: ChapterStatus;
}

export interface UpdateChapterDto {
  title?: string;
  chapterNumber?: number;
  content?: string;
  status?: ChapterStatus;
  wattpadId?: string | null;
  externalDocId?: string | null;
}

export interface ChapterVersion {
  id: number;
  chapterId: string;
  versionNumber: number;
  title: string;
  content: string;
  contentHash: string;
  source: 'cli' | 'word' | 'notepad' | 'google' | 'wattpad';
  createdAt: string;
}

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
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  status: string;
  details: string;
  createdAt: string;
}

export interface InboxMessage {
  id: string;
  fromUser: string;
  subject: string;
  preview: string;
  fullText?: string;
  date: string;
  read: boolean;
}

export interface PublicCliConfig {
  version: string;
  minCliVersion: string;
  apiBaseUrl: string;
  publicAppUrl: string;
  serverStatus: 'healthy' | 'degraded' | 'maintenance';
  features: {
    googleDocsOAuth: boolean;
    wordImport: boolean;
    notepadImport: boolean;
    browserAuth: boolean;
  };
  installerEndpoints: {
    powershell: string;
    linuxMac: string;
  };
  binaries?: Record<
    string,
    {
      filename: string;
      sha256: string;
      size: number;
      downloadUrl: string;
    }
  >;
  routes: Record<string, string>;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
