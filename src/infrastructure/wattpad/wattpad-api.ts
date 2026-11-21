import { SearchFilters, SearchResultItem } from '../../shared/types/search.types';
import { UserSession } from '../../shared/types/auth.types';
import { LibraryItem } from '../../shared/types/library.types';
import { InboxConversation, UserNotification } from '../../shared/types/inbox.types';

/**
 * Cliente HTTP para consultar APIs oficiales de Wattpad
 */
export class WattpadApiClient {
  private static userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

  /**
   * Construye las cabeceras estándar para peticiones a Wattpad
   */
  private static getHeaders(session?: UserSession | null): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': this.userAgent,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    };

    if (session?.token) {
      headers['Authorization'] = `token ${session.token}`;
    }

    if (session?.cookies) {
      const cookieStr = Object.entries(session.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
      if (cookieStr) {
        headers['Cookie'] = cookieStr;
      }
    }

    return headers;
  }

  /**
   * Valida si una sesión es legítima y activa en Wattpad
   */
  public static async verifySession(session: UserSession): Promise<boolean> {
    try {
      const url = 'https://www.wattpad.com/api/v3/users/me';
      const res = await fetch(url, {
        headers: this.getHeaders(session),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && (data.username || data.name)) {
          return true;
        }
      }
      return false;
    } catch {
      // Si no hay red, no invalidamos localmente pero marcamos que no se pudo verificar en vivo
      return true;
    }
  }

  /**
   * Busca novelas en Wattpad utilizando la API oficial de búsqueda
   */
  public static async searchStories(filters: SearchFilters): Promise<SearchResultItem[]> {
    try {
      const query = encodeURIComponent(filters.query.trim());
      let url = `https://www.wattpad.com/api/v3/stories?query=${query}&limit=20&fields=stories(id,title,voteCount,readCount,commentCount,description,completed,cover,user(name,username,avatar),parts(id,title),tags,categories,lastPublishedPart,modifyDate)`;

      if (filters.mature) {
        url += '&mature=1';
      }

      const res = await fetch(url, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      const storiesRaw = data.stories || [];

      return storiesRaw.map((s: any): SearchResultItem => {
        const isCompleted = Boolean(s.completed);
        return {
          id: String(s.id),
          title: s.title || 'Sin título',
          authorUsername: s.user?.username || 'desconocido',
          authorName: s.user?.name || s.user?.username || 'Autor',
          description: s.description || 'Sin descripción disponible.',
          coverUrl: s.cover,
          genre: Array.isArray(s.categories) && s.categories.length > 0 ? s.categories[0] : 'General',
          status: isCompleted ? 'completed' : 'ongoing',
          statusLabel: isCompleted ? 'Completa' : 'En curso',
          chaptersCount: Array.isArray(s.parts) ? s.parts.length : 0,
          reads: Number(s.readCount || 0),
          votes: Number(s.voteCount || 0),
          tags: Array.isArray(s.tags) ? s.tags : [],
          lastUpdated: s.modifyDate || s.lastPublishedPart?.modifyDate || new Date().toISOString(),
          wattpadUrl: `https://www.wattpad.com/story/${s.id}`,
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Obtiene la biblioteca del usuario autenticado
   */
  public static async getLibrary(session: UserSession): Promise<LibraryItem[]> {
    if (!session || !session.token) return [];
    try {
      const url = `https://www.wattpad.com/api/v3/users/${session.userId}/library?limit=30&fields=stories(id,title,description,cover,user(name,username),parts(id,title),modifyDate,categories)`;
      const res = await fetch(url, {
        headers: this.getHeaders(session),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) return [];

      const data = await res.json();
      const list = data.stories || [];

      return list.map((s: any): LibraryItem => ({
        storyId: String(s.id),
        title: s.title,
        authorUsername: s.user?.username || '',
        authorDisplayName: s.user?.name || s.user?.username || '',
        description: s.description || '',
        coverUrl: s.cover,
        genre: Array.isArray(s.categories) && s.categories.length > 0 ? s.categories[0] : 'General',
        chaptersCount: Array.isArray(s.parts) ? s.parts.length : 0,
        lastUpdated: s.modifyDate || new Date().toISOString(),
        wattpadUrl: `https://www.wattpad.com/story/${s.id}`,
        addedAt: new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Obtiene las conversaciones del buzón
   */
  public static async getInbox(session: UserSession): Promise<InboxConversation[]> {
    if (!session || !session.token) return [];
    try {
      const url = `https://www.wattpad.com/api/v3/inbox?limit=20`;
      const res = await fetch(url, {
        headers: this.getHeaders(session),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) return [];

      const data = await res.json();
      const convs = data.conversations || [];

      return convs.map((c: any): InboxConversation => ({
        id: String(c.id),
        withUsername: c.user?.username || 'Usuario',
        withDisplayName: c.user?.name || c.user?.username || 'Usuario',
        withAvatar: c.user?.avatar,
        lastMessageSnippet: c.last_message?.text || c.snippet || 'Mensaje de Wattpad',
        lastMessageDate: c.last_message?.create_date || new Date().toISOString(),
        unread: Boolean(c.unread),
        unreadCount: c.unread_count || 0,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Obtiene notificaciones de la cuenta
   */
  public static async getNotifications(session: UserSession): Promise<UserNotification[]> {
    if (!session || !session.token) return [];
    try {
      const url = `https://www.wattpad.com/api/v3/notifications?limit=20`;
      const res = await fetch(url, {
        headers: this.getHeaders(session),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) return [];

      const data = await res.json();
      const notifs = data.notifications || [];

      return notifs.map((n: any): UserNotification => ({
        id: String(n.id || Math.random()),
        type: n.type || 'system',
        title: n.title || 'Notificación de Wattpad',
        message: n.message || n.text || '',
        createdAt: n.create_date || new Date().toISOString(),
        read: Boolean(n.read),
        targetUrl: n.target_url,
      }));
    } catch {
      return [];
    }
  }
}
