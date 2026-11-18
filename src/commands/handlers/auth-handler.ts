import { CommandDefinition, CommandResult, ParsedCommand } from '../../types/command.types';

export function createAuthCommands(): CommandDefinition[] {
  return [
    {
      name: '/login',
      category: 'auth',
      description: 'Inicia sesión en Wattpad mediante token o credenciales autorizadas',
      descriptionEn: 'Logs into Wattpad via token or authorized credentials',
      usage: '/login [token]',
      examples: ['/login', '/login wt_token_abc123'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const token = parsed.subcommand || parsed.args[0];

        if (!token) {
          return {
            success: true,
            blocks: [
              {
                type: 'info',
                title: 'INICIO DE SESIÓN EN WATTPAD',
                subtitle: 'Autenticación autorizada y segura',
                content:
                  'Para iniciar sesión oficialmente, introduce tu token de acceso de Wattpad:\n\n' +
                  '› /login [tu_token]\n\n' +
                  'Tus credenciales quedarán cifradas localmente con protección del sistema operativo. ' +
                  'Tus novelas y documentos locales se conservan siempre de manera intacta.',
              },
            ],
          };
        }

        try {
          const session = await app.wattpadService.loginWithToken(token);
          app.currentUser = session.user;
          app.connRepo.setConnected('wattpad', 'Wattpad Cloud', true, session.user.username);

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: '¡SESIÓN INICIADA CORRECTAMENTE!',
                subtitle: `Bienvenido de nuevo, ${session.user.name}`,
                statusBadge: 'AUTENTICADO',
                statusColor: '#28A745',
                fields: [
                  { label: 'Usuario', value: `@${session.user.username}` },
                  { label: 'ID Wattpad', value: session.user.id },
                  { label: 'Seguidores', value: String(session.user.numFollowers) },
                  { label: 'Votos recibidos', value: String(session.user.votesReceived) },
                  { label: 'Historias en Wattpad', value: String(session.user.numStories) },
                ],
              },
            ],
          };
        } catch (err: any) {
          return {
            success: false,
            blocks: [
              {
                type: 'error',
                title: 'Error de autenticación',
                content: `No se pudo verificar el token de Wattpad: ${err.message}`,
              },
            ],
          };
        }
      },
    },

    {
      name: '/logout',
      category: 'auth',
      description: 'Cierra la sesión actual de Wattpad y limpia tokens locales',
      descriptionEn: 'Logs out of Wattpad and cleans local tokens',
      usage: '/logout',
      examples: ['/logout'],
      execute: async (app): Promise<CommandResult> => {
        await app.wattpadService.logout();
        app.currentUser = null;
        app.connRepo.setConnected('wattpad', 'Wattpad Cloud', false);

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'SESIÓN FINALIZADA',
              subtitle: 'Tokens de acceso revocados y eliminados localmente.',
              statusBadge: 'DESCONECTADO',
              statusColor: '#808080',
              content:
                'Has cerrado sesión de forma segura.\n' +
                'Tus novelas locales, borradores privados y archivos Word/Notepad se conservan intactos en tu equipo.',
            },
          ],
        };
      },
    },

    {
      name: '/account',
      category: 'auth',
      description: 'Muestra información de la cuenta de Wattpad actualmente conectada',
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
                title: 'ESTADO DE LA CUENTA',
                statusBadge: 'SIN SESIÓN ACTIVA',
                statusColor: '#808080',
                content: 'Actualmente estás utilizando Wattpad CLI en Modo Local.\nUsa /login para conectar tu cuenta de Wattpad.',
              },
            ],
          };
        }

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: `CUENTA: ${user.name} (@${user.username})`,
              statusBadge: 'CONECTADO',
              statusColor: '#28A745',
              fields: [
                { label: 'Descripción', value: user.description || 'Sin biografía' },
                { label: 'Historias publicadas', value: String(user.numStories) },
                { label: 'Seguidores', value: String(user.numFollowers) },
                { label: 'Siguiendo', value: String(user.numFollowing) },
                { label: 'Votos acumulados', value: String(user.votesReceived) },
              ],
            },
          ],
        };
      },
    },
  ];
}
