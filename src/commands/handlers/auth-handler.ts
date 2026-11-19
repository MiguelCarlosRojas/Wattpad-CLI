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
      description: 'Inicia sesión en Wattpad o vincula un token autorizado oficial',
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
                title: 'WATTPAD CONECTADO',
                subtitle: `Sesión activa actualmente como @${app.currentUser.username}`,
                statusBadge: 'AUTORIZADA',
                statusColor: '#28A745',
                fields: [
                  { label: 'Cuenta', value: `@${app.currentUser.username}` },
                  { label: 'Estado', value: 'Autorizada' },
                  { label: 'Sesión', value: 'Válida' },
                  { label: 'Identificador', value: app.currentUser.id },
                  { label: 'Para desconectar', value: 'Ejecuta /logout --confirm' },
                ],
              },
            ],
            message: `WATTPAD CONECTADO — Sesión activa como @${app.currentUser.username}.`,
          };
        }

        // 2. /login without token: Open browser and present authorization modal
        if (!token) {
          const loginUrl = 'https://www.wattpad.com/login';
          await openUrlInBrowser(loginUrl).catch(() => {});

          // Trigger in-terminal modal if running interactively
          if (app.renderer?.appShell?.openAuthModal) {
            app.renderer.appShell.openAuthModal(async (submittedToken: string) => {
              try {
                const session = await app.wattpadService.loginWithToken(submittedToken);
                app.currentUser = session.user;
                if (app.credentialStore) {
                  await app.credentialStore.set('wattpad_token', submittedToken);
                  await app.credentialStore.set('wattpad_user', JSON.stringify(session.user));
                }
                if (app.connRepo?.setConnected) {
                  app.connRepo.setConnected('wattpad', 'Wattpad', true, session.user.username);
                }
                if (app.renderer?.appShell) {
                  app.renderer.appShell.setState({ currentUser: session.user });
                }
                return { success: true, user: session.user };
              } catch (err: any) {
                return { success: false, error: err.message };
              }
            });
          }

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'CONECTAR CUENTA DE WATTPAD',
                subtitle: 'Inicia sesión en el navegador que se abrió.',
                statusBadge: 'ESPERANDO AUTORIZACIÓN',
                statusColor: '#FF6122',
                content:
                  'Inicia sesión en el navegador que se abrió.\n\n' +
                  'Estado: Esperando autorización\n\n' +
                  'Si dispones de un token oficial autorizado, puedes introducirlo en la ventana modal o ejecutar:\n' +
                  '› /login [tu_token]',
                fields: [
                  { label: 'Página oficial', value: loginUrl },
                  { label: 'Estado', value: 'Esperando autorización' },
                  { label: 'Token autorizado', value: 'Introduce tu token oficial con /login [tu_token]' },
                  { label: 'Almacenamiento', value: 'Cifrado local AES-256-GCM (nunca enviado a Render)' },
                ],
              },
            ],
            message: 'Inicia sesión en el navegador que se abrió. Estado: Esperando autorización.',
          };
        }

        // 3. /login [token]: Validate directly against Wattpad identity
        try {
          const session = await app.wattpadService.loginWithToken(token);
          app.currentUser = session.user;

          // Save credentials securely in local CredentialStore (NEVER to Render)
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
                title: 'WATTPAD CONECTADO',
                subtitle: `Cuenta oficial vinculada: @${session.user.username}`,
                statusBadge: 'AUTORIZADA',
                statusColor: '#28A745',
                fields: [
                  { label: 'Cuenta', value: `@${session.user.username}` },
                  { label: 'Estado', value: 'Autorizada' },
                  { label: 'Sesión', value: 'Válida' },
                  { label: 'Nombre', value: session.user.name },
                  { label: 'ID Wattpad', value: session.user.id },
                  { label: 'Historias en Wattpad', value: String(session.user.numStories) },
                  { label: 'Almacén seguro', value: 'Cifrado local con AES-256-GCM en vault.enc' },
                ],
              },
            ],
            message: `WATTPAD CONECTADO — Cuenta @${session.user.username} vinculada con éxito.`,
          };
        } catch (err: any) {
          app.currentUser = null;
          if (app.renderer?.appShell) {
            app.renderer.appShell.setState({ currentUser: null });
          }
          return {
            success: false,
            blocks: [
              {
                type: 'error',
                title: 'Error de autenticación en Wattpad',
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
      usage: '/logout [--confirm]',
      examples: ['/logout', '/logout --confirm'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const isConfirmed = Boolean(parsed.flags.confirm || parsed.flags.c);

        if (!isConfirmed && app.currentUser) {
          return {
            success: true,
            blocks: [
              {
                type: 'warning',
                title: 'CONFIRMAR CIERRE DE SESIÓN EN WATTPAD',
                subtitle: `Sesión actual: @${app.currentUser.username}`,
                statusBadge: 'CONFIRMACIÓN REQUERIDA',
                statusColor: '#FFC107',
                content:
                  '¿Estás seguro de que deseas desconectar tu cuenta de Wattpad?\n\n' +
                  '• Las credenciales se borrarán del almacén local cifrado (vault.enc).\n' +
                  '• Tus novelas, capítulos y documentos locales se mantendrán completamente intactos.\n' +
                  '• Podrás volver a iniciar sesión cuando lo desees con /login.\n\n' +
                  'Para confirmar, escribe:\n' +
                  '› /logout --confirm',
              },
            ],
            message: 'Confirmación requerida: usa /logout --confirm para cerrar la sesión.',
          };
        }

        if (app.wattpadService?.logout) {
          await app.wattpadService.logout();
        }

        if (app.credentialStore) {
          await app.credentialStore.remove('wattpad_token');
          await app.credentialStore.remove('wattpad_user');
          await app.credentialStore.remove('wattpad_session');
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
                'Las credenciales en vault.enc han sido borradas permanentemente.\n' +
                'Tus novelas, capítulos, borradores y manuscritos se mantienen intactos.',
            },
          ],
          message: 'Wattpad: Desconectado',
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
                title: 'CUENTA DE WATTPAD',
                subtitle: 'Wattpad: Desconectado',
                statusBadge: 'DESCONECTADO',
                statusColor: '#808080',
                content: 'Wattpad: Desconectado\n\nNo hay ninguna cuenta de Wattpad vinculada a esta terminal.',
                fields: [
                  { label: 'Estado', value: 'Desconectado' },
                  { label: 'Cuenta', value: 'Sin conectar' },
                  { label: 'Para conectar', value: 'Usa /login para abrir la autorización en el navegador.' },
                  { label: 'Modo Autor Local', value: 'Puedes redactar y gestionar tus novelas localmente.' },
                ],
              },
            ],
            message: 'Wattpad: Desconectado',
          };
        }

        const localStories = app.storyRepo?.findAll ? app.storyRepo.findAll() : [];

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'CUENTA DE WATTPAD',
              subtitle: `Cuenta autorizada: @${user.username}`,
              statusBadge: 'CONECTADO',
              statusColor: '#28A745',
              fields: [
                { label: 'Usuario', value: `@${user.username}` },
                { label: 'Nombre', value: user.name },
                { label: 'Identificador', value: user.id },
                { label: 'Estado de sesión', value: 'Autorizada / Válida' },
                { label: 'Perfil', value: user.description || 'Sin biografía añadida' },
                { label: 'Novelas en Wattpad', value: String(user.numStories) },
                { label: 'Novelas Locales', value: `${localStories.length} obra(s) en CLI` },
                { label: 'Seguidores', value: String(user.numFollowers) },
                { label: 'Votos acumulados', value: String(user.votesReceived) },
              ],
            },
          ],
          message: `CUENTA DE WATTPAD\n\nUsuario: @${user.username}\nEstado: Conectado`,
        };
      },
    },
  ];
}
