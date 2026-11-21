import { chromium, BrowserContext, Page } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { UserSession } from '../../shared/types/auth.types';
import { FileManager } from '../filesystem/file-manager';
import { env } from '../../shared/config/env.config';

/**
 * Servicio de autenticación asistida mediante navegador oficial
 * Utiliza Playwright para interactuar con https://www.wattpad.com/login o /register
 */
export class BrowserAuth {
  private static findBrowserExecutable(): string | undefined {
    if (env.WATTPAD_BROWSER_EXECUTABLE_PATH && fs.existsSync(env.WATTPAD_BROWSER_EXECUTABLE_PATH)) {
      return env.WATTPAD_BROWSER_EXECUTABLE_PATH;
    }

    if (process.platform === 'win32') {
      const candidates = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(os.homedir(), 'AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'),
        path.join(os.homedir(), 'AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe'),
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) return p;
      }
    } else if (process.platform === 'darwin') {
      const candidates = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) return p;
      }
    } else {
      const candidates = [
        '/usr/bin/google-chrome',
        '/usr/bin/microsoft-edge',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) return p;
      }
    }
    return undefined;
  }

  /**
   * Abre el navegador para iniciar sesión o registrarse en Wattpad
   */
  public static async launchAuthFlow(mode: 'login' | 'register'): Promise<UserSession | null> {
    const executablePath = this.findBrowserExecutable();
    const profileDir = path.join(FileManager.getAuthDir(), 'browser-profile');
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    const targetUrl = mode === 'login' ? `${env.WATTPAD_BASE_URL}/login` : `${env.WATTPAD_BASE_URL}/register`;

    try {
      const context: BrowserContext = await chromium.launchPersistentContext(profileDir, {
        executablePath,
        headless: env.WATTPAD_BROWSER_HEADLESS ?? false,
        viewport: { width: 1024, height: 768 },
        args: ['--disable-blink-features=AutomationControlled'],
      });

      const page: Page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

      // Esperar a que el usuario complete el inicio de sesión o registro
      // Esperamos hasta 180 segundos observando cookies de sesión o navegación a la home autenticada
      const maxWaitMs = 180_000;
      const startTime = Date.now();
      let session: UserSession | null = null;

      while (Date.now() - startTime < maxWaitMs) {
        await new Promise((r) => setTimeout(r, 2000));

        // Verificar cookies de sesión de Wattpad
        const cookies = await context.cookies(['https://www.wattpad.com']);
        const tokenCookie = cookies.find((c) => c.name === 'token' || c.name === 'wp_token');
        const userCookie = cookies.find((c) => c.name === 'wp_username' || c.name === 'username');

        // Comprobar si en el localStorage o la ventana hay información del usuario
        let userData: any = null;
        try {
          userData = await page.evaluate(() => {
            const w = window as any;
            if (w.wattpad && w.wattpad.user) {
              return {
                username: w.wattpad.user.username,
                id: w.wattpad.user.id,
                name: w.wattpad.user.name,
                avatar: w.wattpad.user.avatar,
              };
            }
            return null;
          });
        } catch {}

        if (tokenCookie || userData) {
          const cookieMap: Record<string, string> = {};
          cookies.forEach((c) => {
            cookieMap[c.name] = c.value;
          });

          const username = userData?.username || userCookie?.value || 'wattpad_user';
          const userId = String(userData?.id || 'wp_' + Math.random().toString(36).substring(2, 8));
          const displayName = userData?.name || username;

          session = {
            userId,
            username,
            displayName,
            avatarUrl: userData?.avatar,
            token: tokenCookie?.value || cookieMap['wp_token'] || 'session_token',
            cookies: cookieMap,
            createdAt: new Date().toISOString(),
            verified: true,
          };
          break;
        }

        // Si la página se cerró
        if (page.isClosed()) {
          break;
        }
      }

      await context.close();
      return session;
    } catch {
      return null;
    }
  }
}
