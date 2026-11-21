/**
 * Tipos de datos para búsqueda y filtros de novelas
 */

export interface SearchFilters {
  query: string;
  genre: string;      // 'Todos' o género específico
  status: string;     // 'all' | 'ongoing' | 'completed'
  language: string;   // 'all' | 'es' | 'en'
  sort: string;       // 'relevance' | 'popular' | 'recent'
  mature: boolean;
}

export interface SearchResultItem {
  id: string;
  title: string;
  authorUsername: string;
  authorName: string;
  description: string;
  coverUrl?: string;
  genre: string;
  status: 'ongoing' | 'completed';
  statusLabel: string;
  chaptersCount: number;
  reads: number;
  votes: number;
  tags: string[];
  lastUpdated: string;
  wattpadUrl: string;
}
