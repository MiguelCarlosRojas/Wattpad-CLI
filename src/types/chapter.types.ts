export type ChapterStatus = 'draft' | 'pending' | 'synced' | 'published' | 'error';

export interface Chapter {
  id: string; // e.g. "CAP-0001"
  storyId: string; // e.g. "NOV-0001"
  wattpadId: string | null;
  title: string;
  chapterNumber: number;
  content: string;
  contentHash: string; // SHA-256
  wordCount: number;
  status: ChapterStatus;
  externalDocId: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface CreateChapterInput {
  storyId: string;
  title: string;
  chapterNumber?: number;
  content?: string;
  status?: ChapterStatus;
}

export interface UpdateChapterInput {
  title?: string;
  chapterNumber?: number;
  content?: string;
  status?: ChapterStatus;
  wattpadId?: string | null;
  externalDocId?: string | null;
}
