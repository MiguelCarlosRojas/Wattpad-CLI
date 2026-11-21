/**
 * Tipos de datos para historias y manuscritos
 */

export type StoryStatus = 'published' | 'draft' | 'local' | 'modified';

export interface StoryMetadata {
  id: string;                    // ID de Wattpad o ID generado localmente (ej: NOV-xxxxx)
  title: string;
  description: string;
  language: string;              // es, en, etc.
  category?: string;
  genre: string;                 // Romance, Fantasía, etc.
  tags: string[];
  coverPath?: string;
  coverUrl?: string;
  rating?: 'everyone' | 'mature';
  copyright?: string;
  status: StoryStatus;
  wattpadId?: string;
  wattpadUrl?: string;
  authorUsername?: string;
  authorDisplayName?: string;
  totalChapters: number;
  totalWords: number;
  reads: number;
  votes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
  localOnly: boolean;
}

export interface StorySummary {
  id: string;
  title: string;
  author: string;
  genre: string;
  statusLabel: string;
  chaptersCount: number;
  reads: number;
  votes: number;
  isDraft: boolean;
  isLocal: boolean;
  hasLocalChanges: boolean;
  updatedAt: string;
}
