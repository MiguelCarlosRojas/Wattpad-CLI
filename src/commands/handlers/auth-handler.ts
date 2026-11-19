import { CommandDefinition, CommandResult, ParsedCommand } from '../../types/command.types';
import { openUrlInBrowser } from '../../utils/browser';

export function createAuthCommands(): CommandDefinition[] {
  return [
    {
      name: '/register',
      category: 'auth',
      description: 'Abre la página oficial de Wattpad para registrar una cuenta nueva',
      descriptionEn: 'Opens the official Wattpad website to register a new account',
      usage: '/register',
      examples: ['/register'],
      execute: async (): Promise<CommandResult> => {
        const url = 'https://www.wattpad.com/';
        await openUrlInBrowser(url);

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'REGISTRO OFICIAL EN WATTPAD',
              subtitle: 'Crea tu cuenta de autor en la plataforma oficial',
              statusBadge: 'WEB OFICIAL',
              statusColor: '#FF6122',
              fields: [
                { label: 'Sitio oficial', value: url },
                { label: 'Seguridad', value: 'Completa el registro directamente en la web oficial de Wattpad.' },
                { label: 'Siguiente paso', value: 'Una vez creada tu cuenta, usa /login para conectar tu cuenta con Wattpad CLI.' },
              ],
            },
          ],
          message: 'Se ha abierto la página de registro oficial de Wattpad en tu navegador.',
        };
      },
    },

    {
      name: '/login',
      category: 'auth',
      description: 'Inicia sesión en Wattpad o vincula un token autorizado de creador/API',
      descriptionEn: 'Logs into Wattpad via official browser login or authorized token',
      usage: '/login [token]',
      examples: ['/login', '/login wt_token_abc123'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const token = parsed.subcommand || parsed.args[0];

        // 1. Check if session already exists
        if (!token && app.currentUser) {
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'WATTPAD: CONECTADO',
                subtitle: `Sesión activa actualmente como @${app.currentUser.username}`,
                statusBadge: 'SESIÓN ACTIVA',
                statusColor: '#28A745',
                fields: [
                  { label: 'Usuario', value: `@${app.currentUser.username}` },
                  { label: 'Nombre', value: app.currentUser.name },
                  { label: 'ID Wattpad', value: app.currentUser.id },
                  { label: 'Cambiar de cuenta', value: 'Si deseas cambiar de cuenta, ejecuta /logout primero.' },
                ],
              },
            ],
            message: `Ya tienes una sesión activa como @${app.currentUser.username}.`,
          };
        }

        // 2. /login without token: Open official Wattpad login page and explain honest status
        if (!token) {
          const loginUrl = 'https://www.wattpad.com/login';
          await openUrlInBrowser(loginUrl);

          return {
            success: true,
            blocks: [
              {
                type: 'warning',
                title: 'INICIO DE SESIÓN EN WATTPAD',
                subtitle: 'Portal web abierto en tu navegador',
                statusBadge: 'AUTORIZACIÓN REQUERIDA',
                statusColor: '#FFC107',
                content: 'Iniciaste sesión en el navegador, pero Wattpad CLI todavía no está autorizada.',
                fields: [
                  { label: 'Página oficial', value: loginUrl },
                  {
                    label: 'Situación de la API',
                    value: 'Wattpad no ofrece callbacks públicos OAuth2 para aplicaciones CLI de terceros.',
                  },
                  {
                    label: 'Para autorizar la CLI',
                    value: 'Introduce tu token de acceso autorizado con: /login [tu_token]',
                  },
                  {
                    label: 'Modo Autor Local',
                    value: 'Puedes redactar y gestionar tus novelas, capítulos, Word (.docx) y Notepad (.txt) en local.',
                  },
                ],
              },
            ],
            message: 'Iniciaste sesión en el navegador, pero Wattpad CLI todavía no está autorizada.',
          };
        }

        // 3. /login [token]: Validate, authenticate, and securely store
        try {
          const session = await app.wattpadService.loginWithToken(token);
          app.currentUser = session.user;

          // Save credentials securely in CredentialStore
          if (app.credentialStore) {
            await app.credentialStore.set('wattpad_token', token);
            await app.credentialStore.set('wattpad_user', JSON.stringify(session.user));
          }

          if (app.connRepo?.setConnected) {
            app.connRepo.setConnected('wattpad', 'Wattpad', true, session.user.username);
          }

          if (app.renderer?.appShell) {
            app.renderer.appShell.setState({ currentUser: session.user });
          }

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'WATTPAD: CONECTADO',
                subtitle: `¡Bienvenido de nuevo, ${session.user.name}!`,
                statusBadge: 'CONECTADO',
                statusColor: '#28A745',
                fields: [
                  { label: 'Nombre de usuario', value: `@${session.user.username}` },
                  { label: 'Identificador oficial', value: session.user.id },
                  { label: 'Historias en Wattpad', value: String(session.user.numStories) },
                  { label: 'Seguidores', value: String(session.user.numFollowers) },
                  { label: 'Votos acumulados', value: String(session.user.votesReceived) },
                  { label: 'Almacén seguro', value: 'Credencial cifrada con AES-256-GCM en vault.enc' },
                ],
              },
            ],
            message: `WATTPAD: CONECTADO — Cuenta @${session.user.username} vinculada con éxito.`,
          };
        } catch (err: any) {
          return {
            success: false,
            blocks: [
              {
                type: 'error',
                title: 'Error de autenticación',
                content: `No se pudo autorizar la credencial de Wattpad: ${err.message}`,
              },
            ],
            message: `Error de autenticación: ${err.message}`,
          };
        }
      },
    },

    {
      name: '/logout',
      category: 'auth',
      description: 'Cierra la sesión actual de Wattpad y elimina las credenciales almacenadas',
      descriptionEn: 'Logs out of Wattpad and deletes stored credentials',
      usage: '/logout',
      examples: ['/logout'],
      execute: async (app): Promise<CommandResult> => {
        if (app.wattpadService?.logout) {
          await app.wattpadService.logout();
        }

        if (app.credentialStore) {
          await app.credentialStore.remove('wattpad_token');
          await app.credentialStore.remove('wattpad_user');
        }

        app.currentUser = null;

        if (app.apiClient?.setToken) {
          app.apiClient.setToken(null);
        }

        if (app.connRepo?.setConnected) {
          app.connRepo.setConnected('wattpad', 'Wattpad', false);
        }

        if (app.renderer?.appShell) {
          app.renderer.appShell.setState({ currentUser: null });
        }

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'WATTPAD: DESCONECTADO',
              subtitle: 'Sesión finalizada y credenciales eliminadas del almacén seguro.',
              statusBadge: 'DESCONECTADO',
              statusColor: '#808080',
              content:
                'Has cerrado sesión de forma segura en Wattpad CLI.\n' +
                'Las credenciales en vault.enc han sido borradas.\n' +
                'Tus novelas, capítulos, borradores y manuscritos (Word, Notepad, Google Docs) se mantienen intactos.',
            },
          ],
          message: 'WATTPAD: DESCONECTADO — Sesión cerrada y credenciales eliminadas con éxito.',
        };
      },
    },

    {
      name: '/account',
      category: 'auth',
      description: 'Muestra información detallada de la cuenta de Wattpad conectada',
      descriptionEn: 'Shows currently connected Wattpad account details',
      usage: '/account',
      examples: ['/account'],
      execute: async (app): Promise<CommandResult> => {
        const user = app.currentUser;
        if (!user) {
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'ESTADO DE LA CUENTA: DESCONECTADO',
                subtitle: 'Modo Autor Local activo',
                statusBadge: 'SIN SESIÓN VINCULADA',
                statusColor: '#808080',
                content: 'Iniciaste sesión en el navegador, pero Wattpad CLI todavía no está autorizada.',
                fields: [
                  { label: 'Estado', value: 'Desconectado / Modo Autor Local' },
                  { label: 'Para autorizar la CLI', value: 'Escribe /login [token] con un token autorizado de Wattpad.' },
                  { label: 'Iniciar sesión en web', value: 'Escribe /login para abrir la página oficial en el navegador.' },
                  { label: 'Crear cuenta nueva', value: 'Escribe /register para registrarte en la web oficial.' },
                ],
              },
            ],
            message: 'Iniciaste sesión en el navegador, pero Wattpad CLI todavía no está autorizada.',
          };
        }

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: `WATTPAD: CONECTADO — ${user.name} (@${user.username})`,
              subtitle: 'Cuenta oficial de Wattpad vinculada y verificada',
              statusBadge: 'CONECTADO',
              statusColor: '#28A745',
              fields: [
                { label: 'Nombre de usuario', value: `@${user.username}` },
                { label: 'Nombre', value: user.name },
                { label: 'Identificador oficial', value: user.id },
                { label: 'Biografía', value: user.description || 'Sin biografía añadida' },
                { label: 'Historias en Wattpad', value: String(user.numStories) },
                { label: 'Seguidores', value: String(user.numFollowers) },
                { label: 'Siguiendo', value: String(user.numFollowing) },
                { label: 'Votos acumulados', value: String(user.votesReceived) },
                { label: 'Almacén seguro', value: 'Credencial cifrada con AES-256-GCM en vault.enc' },
              ],
            },
          ],
        };
      },
    },
  ];
}
