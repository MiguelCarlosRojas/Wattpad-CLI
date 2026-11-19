export type StoryStatus = 'draft' | 'pending' | 'synced' | 'published' | 'error';

export type EditorPreference = 'word' | 'notepad' | 'google';

export interface Story {
  id: string; // e.g. "NOV-0001"
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoryInput {
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

export interface UpdateStoryInput {
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

/**
 * Parte o capítulo remoto alojado en Wattpad
 */
export interface RemoteWattpadPart {
  id: number;
  title: string;
  draft: boolean;
  modifyDate?: string;
  createDate?: string;
  wordCount?: number;
  readCount?: number;
  voteCount?: number;
  commentCount?: number;
}

/**
 * Obra o novela recuperada legítimamente desde la cuenta de Wattpad
 */
export interface RemoteWattpadStory {
  id: string; // e.g. "403307349"
  title: string;
  description: string;
  coverUrl?: string | null;
  genre: string;
  tags: string[];
  language?: string;
  url: string;
  published: boolean;
  numParts: number;
  publishedCount: number;
  draftCount: number;
  parts: RemoteWattpadPart[];
  lastModified?: string;
  readCount?: number;
  voteCount?: number;
  commentCount?: number;
}

/**
 * Manuscrito local (.docx o .txt) pendiente de subir a Wattpad
 */
export interface LocalManuscript {
  filename: string;
  filePath: string;
  relativePath: string;
  format: 'docx' | 'txt' | 'gdoc';
  detectedTitle: string;
  chapterCount: number;
  wordCount?: number;
  sizeBytes: number;
  lastModified: string;
  status: 'Solo disponible localmente';
  synced: boolean;
  linkedStoryId?: string;
}

/**
 * Catálogo Unificado Oficial de Wattpad CLI
 */
export interface UnifiedStoryCatalog {
  publishedStories: RemoteWattpadStory[];
  wattpadDrafts: RemoteWattpadStory[];
  localStories: Story[];
  localManuscripts: LocalManuscript[];
  lastSync: string;
  remoteSyncFailed?: boolean;
  errorMessage?: string;
}
