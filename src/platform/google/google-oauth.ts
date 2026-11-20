import http from 'http';
import net from 'net';
import crypto from 'crypto';
import fs from 'fs';
import { defaultConfig } from '../../core/config/config';

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  scope: string;
  expiry_date?: number;
}

export interface GoogleAccountProfile {
  email: string;
  name?: string;
  picture?: string;
  connectedAt: string;
}

export interface GoogleOAuthOptions {
  clientId?: string;
  customProfileDir?: string;
  scopes?: string[];
  timeoutMs?: number;
}

export class GoogleOAuth {
  public static readonly DEFAULT_SCOPES = [
    'https://www.googleapis.com/auth/documents.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  public static readonly WRITE_SCOPES = [
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/drive.file',
  ];

  /**
   * Genera el code_verifier criptográfico para PKCE (RFC 7636)
   */
  public static generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Genera el code_challenge derivado con SHA-256 (S256)
   */
  public static generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  /**
   * Genera un state aleatorio único para protección contra ataques CSRF
   */
  public static generateState(): string {
    return crypto.randomBytes(24).toString('base64url');
  }

  /**
   * Construye y valida estructuradamente la URL de autorización OAuth 2.0
   */
  public static buildAuthorizationUrl(params: {
    clientId: string;
    redirectUri: string;
    scopes?: string[];
    state: string;
    codeChallenge: string;
  }): URL {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', params.clientId);
    authUrl.searchParams.set('redirect_uri', params.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    const scopes = params.scopes || GoogleOAuth.DEFAULT_SCOPES;
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('state', params.state);
    authUrl.searchParams.set('code_challenge', params.codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    if (authUrl.searchParams.get('response_type') !== 'code') {
      throw new Error('Error de validación OAuth: El parámetro response_type debe ser estrictamente "code".');
    }
    if (!authUrl.searchParams.get('client_id')) {
      throw new Error('Error de validación OAuth: Falta el parámetro client_id.');
    }
    if (!authUrl.searchParams.get('redirect_uri')) {
      throw new Error('Error de validación OAuth: Falta el parámetro redirect_uri.');
    }

    return authUrl;
  }

  /**
   * Localiza el ejecutable de Google Chrome o Microsoft Edge en el sistema
   */
  public static findBrowserExecutable(): string | null {
    if (process.platform === 'win32') {
      const candidates = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
        `${process.env.LOCALAPPDATA}\\Microsoft\\Edge\\Application\\msedge.exe`,
      ];
      for (const p of candidates) {
        if (p && fs.existsSync(p)) return p;
      }
      return null;
    }

    if (process.platform === 'darwin') {
      const candidates = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) return p;
      }
      return null;
    }

    // Linux
    const candidates = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/microsoft-edge',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }

    return null;
  }

  /**
   * Abre directamente Chrome o Edge como proceso independiente con un perfil exclusivo para Google
   */
  public static launchDedicatedBrowser(url: string, customGoogleProfileDir?: string): boolean {
    const browserExe = this.findBrowserExecutable();
    if (!browserExe) {
      return false;
    }

    const profileDir = customGoogleProfileDir || defaultConfig.googleProfileDir;
    if (!fs.existsSync(profileDir)) {
      try {
        fs.mkdirSync(profileDir, { recursive: true });
      } catch {}
    }

    try {
      Bun.spawn([
        browserExe,
        `--user-data-dir=${profileDir}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=1080,800',
        url,
      ], {
        detached: true,
        stdio: ['ignore', 'ignore', 'ignore'],
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Encuentra un puerto dinámico disponible en el host local (127.0.0.1)
   */
  public static async getAvailablePort(): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.listen(0, '127.0.0.1', () => {
        const address = server.address() as net.AddressInfo;
        const port = address.port;
        server.close(() => resolve(port));
      });
      server.on('error', reject);
    });
  }

  /**
   * Inicia el servidor loopback local temporal para capturar el callback OAuth
   */
  public static async startLoopbackServer(params: {
    port: number;
    expectedState: string;
    codeVerifier: string;
    clientId: string;
    timeoutMs?: number;
  }): Promise<{
    waitForCode: () => Promise<{ code: string; tokens: GoogleTokens; profile?: GoogleAccountProfile }>;
    close: () => void;
  }> {
    let server: http.Server | null = null;
    const timeoutMs = params.timeoutMs || 180000; // 3 minutos

    const waitPromise = new Promise<{ code: string; tokens: GoogleTokens; profile?: GoogleAccountProfile }>((resolve, reject) => {
      let timeoutTimer: any = null;

      server = http.createServer(async (req, res) => {
        try {
          const reqUrl = new URL(req.url || '/', `http://127.0.0.1:${params.port}`);
          if (!reqUrl.pathname.startsWith('/oauth2callback')) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Ruta no encontrada');
            return;
          }

          const receivedState = reqUrl.searchParams.get('state');
          const code = reqUrl.searchParams.get('code');
          const error = reqUrl.searchParams.get('error');

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <html><body style="font-family: system-ui, sans-serif; background: #0D0D0F; color: #F5F5F5; text-align: center; padding: 60px 20px;">
                <h1 style="color: #F97066;">Autorización cancelada o denegada</h1>
                <p>Google reportó el siguiente error: <code>${error}</code></p>
                <p style="color: #A1A1AA;">Puedes cerrar esta pestaña y regresar a Wattpad CLI.</p>
              </body></html>
            `);
            if (timeoutTimer) clearTimeout(timeoutTimer);
            server?.close();
            reject(new Error(`Autorización denegada por Google: ${error}`));
            return;
          }

          if (!receivedState || receivedState !== params.expectedState) {
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <html><body style="font-family: system-ui, sans-serif; background: #0D0D0F; color: #F5F5F5; text-align: center; padding: 60px 20px;">
                <h1 style="color: #F97066;">Error de validación CSRF</h1>
                <p>El parámetro state recibido no coincide con el generado por Wattpad CLI.</p>
              </body></html>
            `);
            if (timeoutTimer) clearTimeout(timeoutTimer);
            server?.close();
            reject(new Error('Fallo de seguridad CSRF: el parámetro state no coincide.'));
            return;
          }

          if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <html><body style="font-family: system-ui, sans-serif; background: #0D0D0F; color: #F5F5F5; text-align: center; padding: 60px 20px;">
                <h1 style="color: #F97066;">Código no recibido</h1>
                <p>No se recibió un código de autorización válido de Google.</p>
              </body></html>
            `);
            if (timeoutTimer) clearTimeout(timeoutTimer);
            server?.close();
            reject(new Error('No se recibió el código de autorización de Google.'));
            return;
          }

          // Intercambiar código por tokens utilizando PKCE
          const redirectUri = `http://127.0.0.1:${params.port}/oauth2callback`;
          const tokens = await GoogleOAuth.exchangeCodeForTokens({
            clientId: params.clientId,
            code,
            codeVerifier: params.codeVerifier,
            redirectUri,
          });

          // Obtener datos del perfil de usuario conectado
          let profile: GoogleAccountProfile | undefined;
          try {
            profile = await GoogleOAuth.getUserProfile(tokens.access_token);
          } catch {}

          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <html><body style="font-family: system-ui, sans-serif; background: #0D0D0F; color: #F5F5F5; text-align: center; padding: 60px 20px;">
              <div style="max-width: 500px; margin: 0 auto; background: #17171B; border: 1px solid #29292F; border-radius: 12px; padding: 30px;">
                <div style="font-size: 40px; margin-bottom: 10px;">✓</div>
                <h1 style="color: #32D583; margin: 0 0 10px 0;">¡Google Docs Conectado!</h1>
                <p style="color: #A1A1AA; font-size: 15px;">La cuenta <strong>${profile?.email || 'Google'}</strong> fue vinculada exitosamente con Wattpad CLI.</p>
                <div style="margin-top: 25px; padding: 12px; background: #1D1D22; border-radius: 8px; color: #FF6122; font-weight: bold;">
                  Ya puedes cerrar esta ventana y regresar a tu terminal.
                </div>
              </div>
            </body></html>
          `);

          if (timeoutTimer) clearTimeout(timeoutTimer);
          setTimeout(() => {
            server?.close();
          }, 1000);

          resolve({ code, tokens, profile });
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(`Error interno durante la autenticación: ${err.message}`);
          if (timeoutTimer) clearTimeout(timeoutTimer);
          server?.close();
          reject(err);
        }
      });

      server.listen(params.port, '127.0.0.1');

      timeoutTimer = setTimeout(() => {
        try {
          server?.close();
        } catch {}
        reject(new Error('Tiempo de espera agotado (3 minutos) esperando la autorización en Google.'));
      }, timeoutMs);
    });

    return {
      waitForCode: () => waitPromise,
      close: () => {
        try {
          server?.close();
        } catch {}
      },
    };
  }

  /**
   * Intercambia el authorization code por tokens mediante el endpoint oficial de Google
   */
  public static async exchangeCodeForTokens(params: {
    clientId: string;
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<GoogleTokens> {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const body = new URLSearchParams({
      client_id: params.clientId,
      code: params.code,
      code_verifier: params.codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: params.redirectUri,
    });

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      const errBody = await res.text();
      let msg = errBody;
      try {
        const json = JSON.parse(errBody);
        msg = json.error_description || json.error || errBody;
      } catch {}
      throw new Error(`Error en intercambio de token de Google (${res.status}): ${msg}`);
    }

    const data = (await res.json()) as any;
    const expiryDate = data.expires_in ? Date.now() + Number(data.expires_in) * 1000 : undefined;

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type || 'Bearer',
      scope: data.scope || '',
      expiry_date: expiryDate,
    };
  }

  /**
   * Renueva el access_token utilizando el refresh_token
   */
  public static async refreshAccessToken(clientId: string, refreshToken: string): Promise<GoogleTokens> {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const body = new URLSearchParams({
      client_id: clientId,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Error al renovar token de Google: ${errBody}`);
    }

    const data = (await res.json()) as any;
    const expiryDate = data.expires_in ? Date.now() + Number(data.expires_in) * 1000 : undefined;

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      token_type: data.token_type || 'Bearer',
      scope: data.scope || '',
      expiry_date: expiryDate,
    };
  }

  /**
   * Consulta el perfil de la cuenta de Google autorizada
   */
  public static async getUserProfile(accessToken: string): Promise<GoogleAccountProfile> {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error('No se pudo consultar el perfil de la cuenta Google');
    }

    const data = (await res.json()) as any;
    return {
      email: data.email || 'usuario@gmail.com',
      name: data.name || data.email,
      picture: data.picture,
      connectedAt: new Date().toISOString(),
    };
  }

  /**
   * Revoca el token de Google para desconexión limpia
   */
  public static async revokeToken(token: string): Promise<boolean> {
    try {
      const res = await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
