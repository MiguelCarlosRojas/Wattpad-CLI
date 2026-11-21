import { SessionManager } from '../auth/session/session-manager';
import { ScreenId } from '../shared/types/navigation.types';

export class SessionGuard {
  private static publicScreens: ScreenId[] = ['welcome', 'login', 'register'];

  public static canAccess(screen: ScreenId): boolean {
    if (this.publicScreens.includes(screen)) {
      return true;
    }
    return SessionManager.isAuthenticated();
  }
}
