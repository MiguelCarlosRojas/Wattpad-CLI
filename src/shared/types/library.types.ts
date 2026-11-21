/**
 * Tipos de datos para la biblioteca del usuario
 */

export interface LibraryItem {
  storyId: string;
  title: string;
  authorUsername: string;
  authorDisplayName: string;
  description: string;
  coverUrl?: string;
  genre: string;
  chaptersCount: number;
  lastReadChapterNumber?: number;
  lastReadChapterTitle?: string;
  lastUpdated: string;
  wattpadUrl: string;
  addedAt: string;
}
