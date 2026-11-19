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
              statusBadge: 'NAVEGADOR',
              statusColor: '#FF6122',
              fields: [
                { label: 'Sitio oficial', value: url },
                { label: 'Seguridad', value: 'Completa el registro directamente en la web oficial de Wattpad.' },
                { label: 'Siguiente paso', value: 'Una vez creada tu cuenta, usa /login para conectarla con Wattpad CLI.' },
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
      description: 'Inicia sesión o conecta tu cuenta de Wattpad mediante los canales oficiales',
      descriptionEn: 'Logs into Wattpad via official browser login or authorized creator token',
      usage: '/login [token]',
      examples: ['/login', '/login wt_token_abc123'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const token = parsed.subcommand || parsed.args[0];

        if (!token) {
          const loginUrl = 'https://www.wattpad.com/login';
          await openUrlInBrowser(loginUrl);

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'INICIO DE SESIÓN EN WATTPAD',
                subtitle: 'Conexión oficial de cuenta de autor',
                statusBadge: 'WEB OFICIAL',
                statusColor: '#FF6122',
                fields: [
                  { label: 'Página de inicio de sesión', value: loginUrl },
                  { label: 'Acceso en navegador', value: 'Se ha abierto la página oficial de inicio de sesión en tu navegador.' },
                  { label: 'Vincular token', value: 'Si posees un token de acceso oficial de creador, vincúlalo con: /login [tu_token]' },
                  { label: 'Modo Autor Local', value: 'Puedes continuar redactando, organizando documentos (Word, Notepad, Google Docs) y preparando capítulos sin necesidad de token directo.' },
                ],
              },
            ],
            message: 'Página oficial de inicio de sesión de Wattpad abierta en el navegador.',
          };
        }

        try {
          const session = await app.wattpadService.loginWithToken(token);
          app.currentUser = session.user;
          if (app.connRepo?.setConnected) {
            app.connRepo.setConnected('wattpad', 'Wattpad', true, session.user.username);
          }

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: '¡SESIÓN INICIADA CORRECTAMENTE!',
                subtitle: `Bienvenido de nuevo, ${session.user.name}`,
                statusBadge: 'CONECTADO',
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
            message: `Cuenta @${session.user.username} conectada con éxito.`,
          };
        } catch (err: any) {
          return {
            success: false,
            blocks: [
              {
                type: 'error',
                title: 'Error de autenticación',
                content: `No se pudo verificar la credencial de Wattpad: ${err.message}`,
              },
            ],
          };
        }
      },
    },

    {
      name: '/logout',
      category: 'auth',
      description: 'Cierra la sesión actual de Wattpad y limpia las credenciales almacenadas',
      descriptionEn: 'Logs out of Wattpad and deletes stored credentials',
      usage: '/logout',
      examples: ['/logout'],
      execute: async (app): Promise<CommandResult> => {
        await app.wattpadService.logout();
        app.currentUser = null;
        if (app.connRepo?.setConnected) {
          app.connRepo.setConnected('wattpad', 'Wattpad', false);
        }

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'SESIÓN FINALIZADA',
              subtitle: 'Credenciales y tokens eliminados localmente con éxito.',
              statusBadge: 'DESCONECTADO',
              statusColor: '#808080',
              content:
                'Has cerrado sesión de forma segura en Wattpad CLI.\n' +
                'Tus novelas, capítulos, borradores y documentos (Word, Notepad, Google Docs) se mantienen intactos.',
            },
          ],
          message: 'Sesión de Wattpad cerrada con éxito.',
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
                title: 'ESTADO DE LA CUENTA',
                statusBadge: 'SIN SESIÓN ACTIVA',
                statusColor: '#808080',
                fields: [
                  { label: 'Estado', value: 'Desconectado / Modo Autor Local' },
                  { label: 'Iniciar sesión', value: 'Escribe /login para conectar tu cuenta de Wattpad.' },
                  { label: 'Crear cuenta', value: 'Escribe /register para registrarte en la web oficial de Wattpad.' },
                ],
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
                { label: 'Nombre de usuario', value: `@${user.username}` },
                { label: 'Identificador oficial', value: user.id },
                { label: 'Descripción / Biografía', value: user.description || 'Sin biografía añadida' },
                { label: 'Historias publicadas', value: String(user.numStories) },
                { label: 'Seguidores', value: String(user.numFollowers) },
                { label: 'Siguiendo', value: String(user.numFollowing) },
                { label: 'Votos acumulados', value: String(user.votesReceived) },
                { label: 'Estado de conexión', value: 'Cuenta verificada y sincronizada' },
              ],
            },
          ],
        };
      },
    },
  ];
}
