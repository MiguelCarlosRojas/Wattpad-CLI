import { UserSession } from '../shared/types/auth.types';
import { BrowserAuth } from '../infrastructure/browser/browser-auth';
import { SessionManager } from './session/session-manager';
import { WattpadApiClient } from '../infrastructure/wattpad/wattpad-api';

export class AuthService {
  /**
   * Inicia sesión utilizando el navegador integrado con Playwright
   */
  public static async loginWithBrowser(): Promise<{ success: boolean; message: string; session?: UserSession }> {
    try {
      const session = await BrowserAuth.launchAuthFlow('login');
      if (session && session.token) {
        SessionManager.setSession(session);
        return {
          success: true,
          message: `Sesión iniciada correctamente como @${session.username}`,
          session,
        };
      }
      return {
        success: false,
        message: 'No se detectó inicio de sesión en el navegador.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Error al abrir el navegador: ${err.message}`,
      };
    }
  }

  /**
   * Inicia sesión con token directo de Wattpad
   */
  public static async loginWithToken(token: string, username: string): Promise<{ success: boolean; message: string; session?: UserSession }> {
    const cleanToken = token.trim();
    const cleanUser = username.trim().replace(/^@/, '');

    if (!cleanToken) {
      return { success: false, message: 'El token de sesión no puede estar vacío.' };
    }

    const session: UserSession = {
      userId: `wp_${cleanUser}`,
      username: cleanUser || 'wattpad_user',
      displayName: cleanUser || 'Usuario',
      token: cleanToken,
      createdAt: new Date().toISOString(),
      verified: true,
    };

    const isValid = await WattpadApiClient.verifySession(session);
    if (!isValid) {
      return {
        success: false,
        message: 'El token de sesión no pudo ser validado con Wattpad.',
      };
    }

    SessionManager.setSession(session);
    return {
      success: true,
      message: `Sesión verificada como @${session.username}`,
      session,
    };
  }

  /**
   * Registra una nueva cuenta abriendo el registro oficial en Wattpad
   */
  public static async registerWithBrowser(): Promise<{ success: boolean; message: string; session?: UserSession }> {
    try {
      const session = await BrowserAuth.launchAuthFlow('register');
      if (session && session.token) {
        SessionManager.setSession(session);
        return {
          success: true,
          message: `Cuenta registrada e iniciada como @${session.username}`,
          session,
        };
      }
      return {
        success: false,
        message: 'Registro no completado en el navegador.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Error en registro: ${err.message}`,
      };
    }
  }

  /**
   * Cierra la sesión activa
   */
  public static logout(): void {
    SessionManager.logout();
  }
}
