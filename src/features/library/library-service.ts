import { LibraryItem } from '../../shared/types/library.types';
import { LocalStore } from '../../infrastructure/persistence/local-store';
import { SessionManager } from '../../auth/session/session-manager';
import { WattpadApiClient } from '../../infrastructure/wattpad/wattpad-api';

export class LibraryService {
  public static async getLibrary(): Promise<LibraryItem[]> {
    const local = LocalStore.loadLibrary();
    const session = SessionManager.getSession();

    if (session && session.token) {
      try {
        const remote = await WattpadApiClient.getLibrary(session);
        if (remote.length > 0) {
          // Fusionar elementos remotos sin duplicar
          const map = new Map<string, LibraryItem>();
          local.forEach((item) => map.set(item.storyId, item));
          remote.forEach((item) => map.set(item.storyId, item));
          const merged = Array.from(map.values());
          LocalStore.saveLibrary(merged);
          return merged;
        }
      } catch {}
    }

    return local;
  }

  public static removeFromLibrary(storyId: string): void {
    const lib = LocalStore.loadLibrary().filter((i) => i.storyId !== storyId);
    LocalStore.saveLibrary(lib);
  }
}
