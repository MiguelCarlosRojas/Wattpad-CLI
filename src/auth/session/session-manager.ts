import { UserSession } from '../../shared/types/auth.types';
import { LocalStore } from '../../infrastructure/persistence/local-store';
import { WattpadApiClient } from '../../infrastructure/wattpad/wattpad-api';

/**
 * Administrador del ciclo de vida de la sesión activa
 */
export class SessionManager {
  private static currentSession: UserSession | null = null;

  /**
   * Inicializa la sesión buscando credenciales guardadas en ~/.wattpad
   */
  public static async init(): Promise<boolean> {
    const saved = LocalStore.loadSession();
    if (saved && saved.token) {
      // Comprobar si la sesión es válida
      const isValid = await WattpadApiClient.verifySession(saved);
      if (isValid) {
        this.currentSession = saved;
        return true;
      } else {
        // Sesión expirada
        LocalStore.clearSession();
        this.currentSession = null;
        return false;
      }
    }
    this.currentSession = null;
    return false;
  }

  public static getSession(): UserSession | null {
    return this.currentSession;
  }

  public static setSession(session: UserSession): void {
    this.currentSession = session;
    LocalStore.saveSession(session);
  }

  public static isAuthenticated(): boolean {
    return this.currentSession !== null && Boolean(this.currentSession.token);
  }

  public static getUsername(): string | null {
    return this.currentSession?.username || null;
  }

  public static logout(): void {
    this.currentSession = null;
    LocalStore.clearSession();
  }
}
