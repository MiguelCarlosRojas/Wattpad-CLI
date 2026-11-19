import { CommandDefinition, CommandResult, ParsedCommand } from '../../types/command.types';

export function createAuthCommands(): CommandDefinition[] {
  return [
    {
      name: '/register',
      category: 'auth',
      description: 'Abre la página oficial de registro de Wattpad en el navegador integrado',
      descriptionEn: 'Opens the official Wattpad registration page in the integrated browser',
      usage: '/register',
      examples: ['/register'],
      execute: async (app): Promise<CommandResult> => {
        await app.wattpadService.register();

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
                { label: 'Página oficial', value: 'https://www.wattpad.com/register' },
                { label: 'Seguridad', value: 'Completa el registro directamente en la web oficial de Wattpad.' },
                { label: 'Siguiente paso', value: 'Una vez creada tu cuenta, usa /login para conectar tu cuenta con Wattpad CLI.' },
              ],
            },
          ],
          message: 'Se ha abierto la página oficial de registro de Wattpad.',
        };
      },
    },

    {
      name: '/login',
      category: 'auth',
      description: 'Inicia sesión de forma interactiva en Wattpad mediante navegador controlado',
      descriptionEn: 'Logs into Wattpad interactively via controlled browser',
      usage: '/login',
      examples: ['/login'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const token = parsed.subcommand || parsed.args[0];

        // 1. Si ya hay una sesión autenticada y no se proporcionaron parámetros
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
                  { label: 'Nombre', value: app.currentUser.name || app.currentUser.username },
                  { label: 'Estado', value: 'Conectado con perfil oficial' },
                  { label: 'Para desconectar', value: 'Ejecuta /logout --confirm' },
                ],
              },
            ],
            message: `WATTPAD CONECTADO — Sesión activa como @${app.currentUser.username}.`,
          };
        }

        // 2. Si se proporciona un token (modo compatibilidad / pruebas)
        if (token) {
          try {
            const session = await app.wattpadService.loginWithToken(token);
            app.currentUser = session.user;

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
                  subtitle: `Sesión vinculada como @${session.user.username}`,
                  statusBadge: 'CONECTADO',
                  statusColor: '#28A745',
                  fields: [
                    { label: 'Cuenta', value: `@${session.user.username}` },
                    { label: 'Nombre', value: session.user.name },
                    { label: 'Estado de conexión', value: 'Conectado' },
                  ],
                },
              ],
              message: `WATTPAD CONECTADO — Sesión activa como @${session.user.username}.`,
            };
          } catch (err: any) {
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Error de autenticación',
                  content: err.message,
                },
              ],
            };
          }
        }

        // 3. /login interactivo mediante ventana emergente independiente controlada con Playwright
        try {
          const result = await app.wattpadService.loginInteractive({
            onStatus: (step, msg) => {
              if (app.appShell && typeof (app.appShell as any).setNotification === 'function') {
                (app.appShell as any).setNotification(msg);
              }
            },
          });

          if (!result.success || !result.user) {
            const isCancelled = result.step === 'cancelado';
            return {
              success: false,
              blocks: [
                {
                  type: isCancelled ? 'warning' : 'error',
                  title: isCancelled ? 'Autenticación cancelada' : 'Error de autenticación',
                  statusBadge: isCancelled ? 'CANCELADA' : 'ERROR',
                  statusColor: isCancelled ? '#FEC84B' : '#F97066',
                  content:
                    result.error ||
                    'No se pudo verificar la sesión en Wattpad. Asegúrate de introducir tus credenciales en la ventana emergente.',
                },
              ],
              message: result.error || (isCancelled ? 'Autenticación cancelada.' : 'Error de autenticación.'),
            };
          }

          app.currentUser = result.user;

          if (app.connRepo?.setConnected) {
            app.connRepo.setConnected('wattpad', 'Wattpad', true, result.user.username);
          }
          if (app.appShell) {
            app.appShell.setState({ currentUser: result.user });
          }

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'WATTPAD CONECTADO',
                subtitle: '✓ Autenticación completada exitosamente',
                statusBadge: 'CONECTADO',
                statusColor: '#32D583',
                fields: [
                  { label: 'Cuenta', value: `@${result.user.username}` },
                  { label: 'Autor', value: result.user.name || result.user.username },
                  { label: 'Estado', value: 'Conectado' },
                  { label: 'Sesión', value: 'Guardada localmente en ~/.wattpad-cli/browser-profile' },
                  { label: 'Instrucción', value: 'Ya puedes cerrar la ventana de autenticación y utilizar Wattpad CLI.' },
                ],
              },
            ],
            message: `✓ Autenticación completada.\nCuenta: @${result.user.username}\nEstado: Conectado\nSesión: Guardada localmente\nYa puedes utilizar Wattpad CLI.`,
          };
        } catch (err: any) {
          return {
            success: false,
            blocks: [
              {
                type: 'error',
                title: 'Error al iniciar sesión',
                content: err.message || 'Error en el navegador de autenticación.',
              },
            ],
          };
        }
      },
    },

    {
      name: '/logout',
      category: 'auth',
      description: 'Cierra la sesión de Wattpad y elimina el perfil autenticado local',
      descriptionEn: 'Logs out from Wattpad and removes the local authenticated profile',
      usage: '/logout [--confirm]',
      examples: ['/logout', '/logout --confirm'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const isConfirmed = Boolean(parsed.flags.confirm || parsed.flags.c);

        if (!isConfirmed) {
          return {
            success: false,
            blocks: [
              {
                type: 'warning',
                title: 'CONFIRMACIÓN DE CIERRE DE SESIÓN REQUERIDA',
                subtitle: 'Para evitar desconexiones accidentales, confirma la operación',
                statusBadge: 'CONFIRMACIÓN',
                statusColor: '#FFC107',
                content:
                  '¿Estás seguro de que deseas cerrar sesión en Wattpad CLI?\n' +
                  'Se invalidará el perfil de sesión guardado localmente.\n\n' +
                  'Para confirmar ejecuta:\n' +
                  '› /logout --confirm',
              },
            ],
            message: 'Cierre de sesión cancelado. Usa /logout --confirm para confirmar.',
          };
        }

        const prevUser = app.currentUser?.username;
        await app.wattpadService.logout();
        app.currentUser = null;

        if (app.connRepo?.setConnected) {
          app.connRepo.setConnected('wattpad', 'Wattpad', false, null);
        }
        if (app.renderer?.appShell) {
          app.renderer.appShell.setState({ currentUser: null });
        }

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'SESIÓN FINALIZADA',
              subtitle: prevUser ? `Desconectado de @${prevUser}` : 'Wattpad desconectado',
              statusBadge: 'DESCONECTADO',
              statusColor: '#808080',
              fields: [
                { label: 'Estado', value: 'Sin conexión' },
                { label: 'Perfil local', value: 'Eliminado de forma segura' },
                { label: 'Para volver a conectar', value: 'Ejecuta /login en cualquier momento con otra cuenta' },
              ],
            },
          ],
          message: 'Has cerrado sesión exitosamente. Estado actual: Sin conexión.',
        };
      },
    },

    {
      name: '/profile',
      category: 'auth',
      description: 'Consulta el perfil real de la cuenta de Wattpad conectada',
      descriptionEn: 'Views real profile of the connected Wattpad account',
      usage: '/profile',
      examples: ['/profile'],
      execute: async (app): Promise<CommandResult> => {
        const user = await app.wattpadService.getProfile();

        if (!user) {
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'PERFIL DE WATTPAD',
                subtitle: 'Estado de conexión',
                statusBadge: 'SIN CONEXIÓN',
                statusColor: '#808080',
                fields: [
                  { label: 'Wattpad', value: 'Desconectado' },
                  { label: 'Instrucción', value: 'Ejecuta /login para conectar tu cuenta oficial de Wattpad.' },
                ],
              },
            ],
            message: 'Wattpad: Desconectado. Usa /login para conectar tu cuenta.',
          };
        }

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: `PERFIL OFICIAL: @${user.username}`,
              subtitle: user.name ? `${user.name}` : `@${user.username}`,
              statusBadge: 'CONECTADO',
              statusColor: '#28A745',
              fields: [
                { label: 'Usuario', value: `@${user.username}` },
                { label: 'Nombre', value: user.name || user.username },
                { label: 'Biografía', value: user.description || 'Sin biografía' },
                { label: 'Obras en Wattpad', value: `${user.numStories || 0} historia(s)` },
                { label: 'Seguidores', value: `${user.numFollowers || 0}` },
                { label: 'Votos recibidos', value: `${user.votesReceived || 0}` },
              ],
            },
          ],
        };
      },
    },

    {
      name: '/account',
      category: 'auth',
      description: 'Alias de /profile: consulta el estado y perfil de la cuenta',
      descriptionEn: 'Alias for /profile: views account status and profile',
      usage: '/account',
      examples: ['/account'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        // Redirige a /profile
        const profileCmd = createAuthCommands().find((c) => c.name === '/profile');
        if (profileCmd) {
          return profileCmd.execute(app, parsed);
        }
        return { success: false, message: 'Comando no disponible.' };
      },
    },
  ];
}
