import { CommandDefinition, CommandResult, ParsedCommand } from '../../types/command.types';

export function createProfileCommands(): CommandDefinition[] {
  return [
    {
      name: '/profile',
      subcommands: ['edit'],
      category: 'profile',
      description: 'Consulta o edita la información pública de tu perfil de Wattpad',
      descriptionEn: 'View or edit public Wattpad profile information',
      usage: '/profile [edit "nueva biografía"]',
      examples: ['/profile', '/profile edit "Escritor de novelas de fantasía y misterio"'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const user = app.currentUser;
        if (!user) {
          return {
            success: false,
            blocks: [
              {
                type: 'warning',
                title: 'Sesión no iniciada',
                content: 'Debes iniciar sesión con /login para consultar tu perfil de Wattpad.',
              },
            ],
          };
        }

        if (parsed.subcommand === 'edit') {
          const newBio = parsed.args.join(' ');
          if (!newBio) {
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Argumento requerido',
                  content: 'Uso: /profile edit "tu nueva descripción"',
                },
              ],
            };
          }

          user.description = newBio;
          return {
            success: true,
            blocks: [
              {
                type: 'success',
                title: 'Perfil actualizado',
                content: `Tu descripción de perfil ha sido actualizada: "${newBio}"`,
              },
            ],
          };
        }

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: `PERFIL DE WATTPAD: ${user.name}`,
              subtitle: `@${user.username}`,
              statusBadge: 'AUTOR OFICIAL',
              statusColor: '#FF6122',
              fields: [
                { label: 'Biografía', value: user.description || 'Sin biografía' },
                { label: 'Historias publicadas', value: String(user.numStories) },
                { label: 'Comunidad', value: `${user.numFollowers} seguidores | ${user.numFollowing} siguiendo` },
                { label: 'Votos recibidos', value: String(user.votesReceived) },
                { label: 'Listas de lectura', value: String(user.numLists) },
              ],
            },
          ],
        };
      },
    },

    {
      name: '/inbox',
      subcommands: ['open'],
      category: 'profile',
      description: 'Consulta los mensajes y notificaciones de tu buzón de Wattpad',
      descriptionEn: 'View Wattpad inbox messages and notifications',
      usage: '/inbox [open msg_id]',
      examples: ['/inbox', '/inbox open msg_1'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const messages = await app.wattpadService.getInboxMessages();

        if (parsed.subcommand === 'open') {
          const id = parsed.args[0];
          const target = messages.find((m) => m.id === id);
          if (!target) {
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Mensaje no encontrado',
                  content: `No existe ningún mensaje con ID "${id}". Usa /inbox para listar tus mensajes.`,
                },
              ],
            };
          }

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: target.subject,
                subtitle: `De: @${target.fromUser} | Fecha: ${target.date.slice(0, 10)}`,
                statusBadge: target.read ? 'LEÍDO' : 'NUEVO',
                statusColor: target.read ? '#808080' : '#28A745',
                content: target.fullText || target.preview,
              },
            ],
          };
        }

        if (messages.length === 0) {
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'BUZÓN DE ENTRADA',
                content: 'No tienes mensajes en tu buzón actualmente.',
              },
            ],
          };
        }

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'BUZÓN DE WATTPAD',
              subtitle: 'Mensajes y conversaciones recibidas',
              statusBadge: `${messages.length} MENSAJES`,
              statusColor: '#17A2B8',
              items: messages.map((m) => ({
                primary: `[${m.id}] De @${m.fromUser}: ${m.subject}`,
                secondary: m.preview,
                badge: m.read ? 'LEÍDO' : 'NUEVO',
              })),
            },
          ],
        };
      },
    },
  ];
}
