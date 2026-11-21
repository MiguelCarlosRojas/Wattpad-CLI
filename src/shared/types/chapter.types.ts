/**
 * Tipos de datos para capítulos y versiones
 */

export type ChapterStatus = 'published' | 'draft' | 'modified';

export interface ChapterMetadata {
  id: string;                     // ej: CAP-xxxxx
  storyId: string;
  number: number;
  title: string;
  status: ChapterStatus;
  wordsCount: number;
  charsCount: number;
  createdAt: string;
  updatedAt: string;
  wattpadPartId?: string;
  wattpadUrl?: string;
  filePath: string;               // Ruta al archivo .md local
  syncedAt?: string;
}

export interface ChapterBackup {
  backupId: string;
  chapterId: string;
  storyId: string;
  timestamp: string;
  wordsCount: number;
  filePath: string;
}
