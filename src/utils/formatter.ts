import { ChapterStatus } from '../types/chapter.types';
import { StoryStatus } from '../types/story.types';

export function countWords(text: string): number {
  if (!text) return 0;
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).length;
}

export function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function formatDate(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatStatusBadge(status: StoryStatus | ChapterStatus): { text: string; color: string } {
  switch (status) {
    case 'draft':
      return { text: '[BORRADOR LOCAL]', color: '#808080' };
    case 'pending':
      return { text: '[PENDIENTE DE PUBLICACIÓN]', color: '#FFC107' };
    case 'synced':
      return { text: '[SINCRONIZADO]', color: '#17A2B8' };
    case 'published':
      return { text: '[PUBLICADO EN WATTPAD]', color: '#28A745' };
    case 'error':
      return { text: '[ERROR]', color: '#DC3545' };
    default:
      return { text: `[${status}]`, color: '#FFFFFF' };
  }
}

export function sanitizeFileName(name: string): string {
  return name
    .trim()
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}
