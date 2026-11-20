import { CommandDefinition, CommandResult, ParsedCommand } from '../../../core/types/command.types';

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

        // 2. Si se proporciona un token (modo pruebas automatizadas)
        if (token) {
          if (process.env.NODE_ENV !== 'test') {
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Autenticación con token no permitida',
                  content:
                    'El inicio de sesión mediante token no está permitido en producción por motivos de seguridad oficial. Ejecuta /login directamente para abrir la ventana de autenticación de Wattpad.',
                },
              ],
              message: 'Autenticación con token no permitida en producción. Usa /login.',
            };
          }

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
                  { label: 'Sesión', value: 'Guardada localmente' },
                ],
              },
            ],
            message: `✓ Autenticación completada.\n\nCuenta: @${result.user.username}\nEstado: Conectado\nSesión: Guardada localmente\n\nWATTPAD CONECTADO\n\n✓ Autenticación completada exitosamente\n\nCuenta       : @${result.user.username}\nAutor        : ${result.user.name || result.user.username}\nEstado       : Conectado`,
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
      description: 'Consulta el perfil real de la cuenta de Wattpad conectada con avatar y estadísticas',
      descriptionEn: 'Views real profile of the connected Wattpad account with avatar and statistics',
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

        const avatarLocalPath = await app.wattpadService.downloadAndCacheAvatar(user.username, user.avatar);

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: `PERFIL OFICIAL: @${user.username}`,
              subtitle: user.name ? `${user.name}` : `@${user.username}`,
              statusBadge: 'CONECTADO',
              statusColor: '#32D583',
              fields: [
                { label: 'Usuario', value: `@${user.username}` },
                { label: 'Nombre', value: user.name || user.username },
                { label: 'Biografía', value: user.description || 'Sin biografía' },
                { label: 'Obras en Wattpad', value: `${user.numStories || 0} historia(s)` },
                { label: 'Seguidores', value: `${(user.numFollowers || 0).toLocaleString()} seguidores` },
                { label: 'Siguiendo', value: `${(user.numFollowing || 0).toLocaleString()} autores` },
                { label: 'Listas de lectura', value: `${user.numLists || 0} listas` },
                { label: 'Votos recibidos', value: `${(user.votesReceived || 0).toLocaleString()} votos` },
                { label: 'Avatar en caché', value: avatarLocalPath || 'Avatar estándar' },
                { label: 'Miembro desde', value: user.created ? user.created.slice(0, 10) : 'Cuenta activa' },
              ],
            },
          ],
        };
      },
    },

    {
      name: '/inbox',
      category: 'account',
      description: 'Consulta las notificaciones y mensajes de tu cuenta oficial de Wattpad',
      descriptionEn: 'Views notifications and messages of your official Wattpad account',
      usage: '/inbox',
      examples: ['/inbox'],
      execute: async (app): Promise<CommandResult> => {
        if (!app.currentUser) {
          return {
            success: false,
            blocks: [
              {
                type: 'error',
                title: 'SESIÓN REQUERIDA',
                content: 'Debes iniciar sesión con tu cuenta de Wattpad para consultar tu bandeja de entrada.\nUsa /login.',
              },
            ],
            message: 'Inicia sesión con /login para ver tu bandeja de entrada.',
          };
        }

        const inbox = await app.wattpadService.getInbox();

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: `BANDEJA DE ENTRADA: @${app.currentUser.username}`,
              subtitle: 'Notificaciones y mensajes de Wattpad',
              statusBadge: 'SINCRONIZADO',
              statusColor: '#32D583',
              fields: [
                { label: 'Notificaciones', value: `${inbox.notifications.length} notificación(es)` },
                { label: 'Mensajes privados', value: `${inbox.messages.length} mensaje(s) directos` },
                { label: 'Privacidad y seguridad', value: 'Wattpad gestiona la mensajería privada desde la web oficial por políticas anti-spam.' },
              ],
            },
            ...inbox.notifications.map((n) => ({
              type: 'card' as const,
              title: `Notificación: ${n.type.toUpperCase()}`,
              subtitle: n.text,
              statusBadge: 'NUEVA',
              statusColor: '#FF6122',
              fields: [
                { label: 'Fecha', value: n.date.slice(0, 16).replace('T', ' ') },
              ],
            })),
          ],
          message: `Bandeja de entrada sincronizada para @${app.currentUser.username}.`,
        };
      },
    },

    {
      name: '/library',
      category: 'account',
      description: 'Consulta tus listas de lectura y novelas guardadas en la biblioteca de Wattpad',
      descriptionEn: 'Views reading lists and saved stories in your Wattpad library',
      usage: '/library',
      examples: ['/library'],
      execute: async (app): Promise<CommandResult> => {
        if (!app.currentUser) {
          return {
            success: false,
            blocks: [
              {
                type: 'error',
                title: 'SESIÓN REQUERIDA',
                content: 'Debes iniciar sesión con tu cuenta de Wattpad para consultar tu biblioteca.\nUsa /login.',
              },
            ],
            message: 'Inicia sesión con /login para ver tu biblioteca.',
          };
        }

        const library = await app.wattpadService.getLibrary();

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: `BIBLIOTECA DE @${app.currentUser.username}`,
              subtitle: `${library.readingLists.length} lista(s) de lectura registradas`,
              statusBadge: 'BIBLIOTECA',
              statusColor: '#FF6122',
            },
            ...library.readingLists.map((l) => ({
              type: 'card' as const,
              title: `Lista: ${l.name}`,
              subtitle: `${l.storyCount} historia(s) guardadas`,
              statusBadge: 'LISTA',
              statusColor: '#32D583',
              fields: [
                { label: 'ID', value: l.id },
                { label: 'Historias', value: `${l.storyCount}` },
              ],
            })),
          ],
          message: `Biblioteca cargada para @${app.currentUser.username}.`,
        };
      },
    },

    {
      name: '/myworks',
      category: 'account',
      description: 'Muestra exclusivamente tus novelas publicadas y borradores guardados en Wattpad',
      descriptionEn: 'Displays exclusively your published stories and drafts saved in Wattpad',
      usage: '/myworks [--published] [--drafts]',
      examples: ['/myworks', '/myworks --published', '/myworks --drafts'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        if (!app.currentUser) {
          return {
            success: false,
            blocks: [
              {
                type: 'error',
                title: 'SESIÓN REQUERIDA',
                content: 'Debes iniciar sesión con tu cuenta de Wattpad para consultar tus obras en la plataforma.\nUsa /login.',
              },
            ],
            message: 'Inicia sesión con /login para ver tus obras.',
          };
        }

        const remote = await app.wattpadService.fetchRemoteWorks();
        const published = (remote.stories || []).filter((s) => s.published);
        const drafts = (remote.stories || []).filter((s) => !s.published);

        const onlyPublished = Boolean(parsed.flags.published || parsed.flags.p);
        const onlyDrafts = Boolean(parsed.flags.drafts || parsed.flags.d);

        const blocks: any[] = [
          {
            type: 'card',
            title: `MIS OBRAS EN WATTPAD (@${app.currentUser.username})`,
            subtitle: `${published.length} publicada(s) · ${drafts.length} borrador(es) en Wattpad`,
            statusBadge: 'WATTPAD',
            statusColor: '#FF6122',
          },
        ];

        if (!onlyDrafts && published.length > 0) {
          blocks.push({
            type: 'card',
            title: 'NOVELAS PUBLICADAS EN WATTPAD',
            subtitle: `${published.length} obra(s) visibles para los lectores`,
            statusBadge: 'PUBLICADAS',
            statusColor: '#32D583',
          });
          for (const s of published) {
            blocks.push({
              type: 'card',
              title: `${s.title} [${s.id}]`,
              subtitle: s.description ? s.description.slice(0, 100) + '...' : 'Sin sinopsis',
              statusBadge: 'PUBLICADA',
              statusColor: '#32D583',
              fields: [
                { label: 'Capítulos', value: `${s.numParts}` },
                { label: 'Lecturas', value: (s.readCount || 0).toLocaleString() },
                { label: 'Votos', value: (s.voteCount || 0).toLocaleString() },
                { label: 'Enlace', value: s.url },
              ],
            });
          }
        }

        if (!onlyPublished && drafts.length > 0) {
          blocks.push({
            type: 'card',
            title: 'BORRADORES EN WATTPAD (NO PUBLICADOS)',
            subtitle: `${drafts.length} borrador(es) en tu cuenta de Wattpad`,
            statusBadge: 'BORRADOR EN WATTPAD',
            statusColor: '#FEC84B',
          });
          for (const s of drafts) {
            blocks.push({
              type: 'card',
              title: `${s.title} [${s.id}]`,
              subtitle: s.description ? s.description.slice(0, 100) + '...' : 'Sin sinopsis',
              statusBadge: 'BORRADOR EN WATTPAD',
              statusColor: '#FEC84B',
              fields: [
                { label: 'Partes en borrador', value: `${s.numParts}` },
                { label: 'Última modificación', value: s.lastModified ? s.lastModified.slice(0, 16).replace('T', ' ') : 'Reciente' },
                { label: 'Enlace', value: s.url },
              ],
            });
          }
        }

        return {
          success: true,
          blocks,
          message: `Mis obras en Wattpad: ${published.length} publicadas, ${drafts.length} borradores.`,
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
        const profileCmd = createAuthCommands().find((c) => c.name === '/profile');
        if (profileCmd) {
          return profileCmd.execute(app, parsed);
        }
        return { success: false, message: 'Comando no disponible.' };
      },
    },
  ];
}
