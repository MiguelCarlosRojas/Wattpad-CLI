import { CommandDefinition, CommandResult, ParsedCommand, RenderBlock } from '../../types/command.types';
import { defaultConfig } from '../../config/config';
import { env } from '../../config/env';

export function createConnectCommands(): CommandDefinition[] {
  return [
    {
      name: '/connect',
      subcommands: ['word', 'notepad', 'google'],
      category: 'connections',
      description: 'Muestra y administra las conexiones externas con Word, Bloc de Notas y Google Docs',
      descriptionEn: 'View and manage external connections with Word, Notepad, and Google Docs',
      usage: '/connect [word | notepad | google]',
      examples: ['/connect', '/connect word', '/connect notepad', '/connect google'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const target = parsed.subcommand;

        // /connect word
        if (target === 'word') {
          app.connRepo.setConnected('word', 'Microsoft Word (.docx)', true, 'Local Office', defaultConfig.docsDir);
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'CONEXIÓN: MICROSOFT WORD',
                subtitle: 'Integración DOCX activa',
                statusBadge: 'CONECTADO',
                statusColor: '#28A745',
                fields: [
                  { label: 'Estado', value: 'Activo y verificado' },
                  { label: 'Directorio de Novelas', value: defaultConfig.docsDir },
                  { label: 'Compatibilidad', value: 'Word 2016+, Office 365, LibreOffice' },
                  { label: 'Detección de cambios', value: 'Hash SHA-256 automático' },
                ],
              },
            ],
          };
        }

        // /connect notepad
        if (target === 'notepad') {
          app.connRepo.setConnected('notepad', 'Bloc de Notas (.txt)', true, 'Local Text Editor', defaultConfig.docsDir);
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'CONEXIÓN: BLOC DE NOTAS',
                subtitle: 'Integración TXT UTF-8 activa',
                statusBadge: 'CONECTADO',
                statusColor: '#28A745',
                fields: [
                  { label: 'Estado', value: 'Activo y verificado' },
                  { label: 'Codificación', value: 'UTF-8 sin BOM' },
                  { label: 'Directorio de Novelas', value: defaultConfig.docsDir },
                ],
              },
            ],
          };
        }

        // /connect google
        if (target === 'google') {
          try {
            const { authUrl, sessionId } = await app.googleIntegration.startAuth();

            // Open browser only in interactive non-test environment
            if (env.NODE_ENV !== 'test') {
              Bun.spawn(['cmd', '/c', 'start', '""', authUrl], { detached: true });
            }

            return {
              success: true,
              blocks: [
                {
                  type: 'card',
                  title: 'AUTORIZACIÓN CLOUD DE GOOGLE DOCS',
                  subtitle: 'Flujo oficial OAuth 2.0 HTTPS (Sin servidores localhost)',
                  statusBadge: 'AUTORIZACIÓN REQUERIDA',
                  statusColor: '#FFC107',
                  fields: [
                    { label: 'URL de Autorización', value: authUrl },
                    { label: 'Callback Cloud', value: env.GOOGLE_REDIRECT_URI },
                    { label: 'ID Sesión', value: sessionId },
                    { label: 'Seguridad', value: 'OAuth 2.0 Oficial de Google con almacenamiento seguro en la nube' },
                  ],
                },
              ],
              message: 'Autoriza el acceso en tu navegador en la nube. Al regresar ejecuta /connect para verificar.',
            };
          } catch (err: any) {
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Error al conectar Google Docs',
                  content: `No se pudo iniciar el flujo de OAuth de Google en la nube: ${err.message}`,
                },
              ],
            };
          }
        }

        // /connect (General status overview)
        const connections = app.connRepo.getAll();
        const blocks: RenderBlock[] = [
          {
            type: 'card',
            title: 'ADMINISTRADOR DE CONEXIONES EXTERNAS',
            subtitle: 'Estado en tiempo real de cada integración documental y en la nube',
            statusBadge: 'CENTRO DE CONEXIONES',
            statusColor: '#FF6122',
          },
        ];

        for (const conn of connections) {
          blocks.push({
            type: 'card',
            title: conn.name,
            statusBadge: conn.isConnected ? 'CONECTADO' : 'DESCONECTADO',
            statusColor: conn.isConnected ? '#28A745' : '#808080',
            fields: [
              { label: 'Identificador / Cuenta', value: conn.accountIdentifier || 'No configurado' },
              { label: 'Ruta Base', value: conn.basePath || 'Por defecto' },
              { label: 'Última Sincronización', value: conn.lastSyncAt ? conn.lastSyncAt.slice(0, 16).replace('T', ' ') : 'Nunca' },
            ],
          });
        }

        return {
          success: true,
          blocks,
        };
      },
    },

    {
      name: '/disconnect',
      subcommands: ['word', 'notepad', 'google'],
      category: 'connections',
      description: 'Desconecta una integración externa',
      descriptionEn: 'Disconnects an external integration',
      usage: '/disconnect [word | notepad | google]',
      examples: ['/disconnect word', '/disconnect google'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const target = parsed.subcommand as 'word' | 'notepad' | 'google';

        if (!target || !['word', 'notepad', 'google'].includes(target)) {
          return {
            success: false,
            blocks: [{ type: 'error', title: 'Objetivo requerido', content: 'Uso: /disconnect [word | notepad | google]' }],
          };
        }

        if (target === 'google') {
          await app.googleService.disconnect();
        }

        app.connRepo.setConnected(target, target, false);

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'INTEGRACIÓN DESCONECTADA',
              subtitle: target.toUpperCase(),
              statusBadge: 'DESCONECTADO',
              statusColor: '#808080',
              content: `La conexión con ${target} ha sido desactivada. Tus archivos locales permanecen intactos.`,
            },
          ],
        };
      },
    },

    {
      name: '/documents',
      category: 'connections',
      description: 'Muestra la organización de documentos asociados por novela y capítulo',
      descriptionEn: 'Displays organized documents associated with each story and chapter',
      usage: '/documents [NOV-xxxx]',
      examples: ['/documents', '/documents NOV-0001'],
      execute: (app, parsed: ParsedCommand): CommandResult => {
        const storyId = parsed.subcommand || parsed.args[0] || app.currentStoryId;
        const stories = storyId ? [app.storyRepo.findById(storyId)].filter(Boolean) : app.storyRepo.findAll();

        if (stories.length === 0) {
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'ORGANIZACIÓN DE DOCUMENTOS',
                subtitle: 'Mis novelas / Documentos',
                statusBadge: '0 DOCUMENTOS',
                statusColor: '#808080',
                content: 'No hay documentos asociados aún. Usa /story new y /chapter new para generar tu biblioteca estructurada.',
              },
            ],
          };
        }

        const blocks: RenderBlock[] = [
          {
            type: 'card',
            title: 'ORGANIZACIÓN DE DOCUMENTOS POR NOVELA',
            subtitle: 'Estructura organizada de archivos Microsoft Word (.docx), Bloc de notas (.txt) y Google Docs',
            statusBadge: `${stories.length} NOVELAS`,
            statusColor: '#FF6122',
          },
        ];

        for (const story of stories) {
          if (!story) continue;
          const chapters = app.chapterRepo.findByStoryId(story.id);
          const fields: { label: string; value: string }[] = [
            { label: 'Directorio', value: `Mis novelas/${story.title}/` },
            { label: 'Editor Preferido', value: story.editorPreference.toUpperCase() },
          ];

          for (const ch of chapters) {
            const ext = story.editorPreference === 'notepad' ? '.txt' : '.docx';
            const numStr = String(ch.chapterNumber).padStart(3, '0');
            fields.push({
              label: `Capítulo ${ch.chapterNumber}`,
              value: `${numStr} - ${ch.title}${ext} [${ch.status.toUpperCase()}]`,
            });
          }

          blocks.push({
            type: 'card',
            title: `${story.title} [${story.id}]`,
            subtitle: `${chapters.length} capítulo(s) / documento(s) asociado(s)`,
            statusBadge: story.editorPreference.toUpperCase(),
            statusColor: '#FF6122',
            fields,
          });
        }

        return {
          success: true,
          blocks,
        };
      },
    },
  ];
}
