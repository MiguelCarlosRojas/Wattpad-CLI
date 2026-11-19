import fs from 'fs';
import path from 'path';
import { CommandDefinition, CommandResult, ParsedCommand, RenderBlock } from '../../../core/types/command.types';
import { defaultConfig } from '../../../core/config/config';
import { env } from '../../../core/config/env';

export function createConnectCommands(): CommandDefinition[] {
  return [
    {
      name: '/connect',
      subcommands: ['word', 'notepad', 'google', 'docs'],
      category: 'connections',
      description: 'Administrador de documentos reales e integraciones (Word, Bloc de Notas, Google Docs)',
      descriptionEn: 'Real document manager and integrations (Word, Notepad, Google Docs)',
      usage: '/connect [word | notepad | google | docs]',
      examples: ['/connect', '/connect word', '/connect notepad', '/connect google', '/connect docs'],
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
                title: 'ADMINISTRADOR DOCUMENTAL: MICROSOFT WORD (.DOCX)',
                subtitle: 'Motor nativo de importación y exportación DOCX activado',
                statusBadge: 'ACTIVO',
                statusColor: '#28A745',
                fields: [
                  { label: 'Formato', value: 'Microsoft Word (.docx)' },
                  { label: 'Directorio de Manuscritos', value: defaultConfig.docsDir },
                  { label: 'Capacidades', value: 'Lectura de párrafos, detección de títulos y capítulos, preservación del texto' },
                  { label: 'Uso recomendado', value: 'Usa /chapter import <archivo.docx> para importar' },
                ],
              },
            ],
            message: 'Integración de Microsoft Word (.docx) lista para procesar manuscritos.',
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
                title: 'ADMINISTRADOR DOCUMENTAL: BLOC DE NOTAS (.TXT)',
                subtitle: 'Lector y estructurador UTF-8 activo',
                statusBadge: 'ACTIVO',
                statusColor: '#28A745',
                fields: [
                  { label: 'Formato', value: 'Texto plano (.txt) codificado en UTF-8' },
                  { label: 'Directorio de Manuscritos', value: defaultConfig.docsDir },
                  { label: 'Capacidades', value: 'Detección automática de separaciones de capítulos (Capítulo X, líneas de corte)' },
                  { label: 'Uso recomendado', value: 'Usa /chapter import <archivo.txt> para importar' },
                ],
              },
            ],
            message: 'Integración de Bloc de Notas (.txt) lista para procesar manuscritos.',
          };
        }

        // /connect google
        if (target === 'google') {
          try {
            const isConnected = await app.googleService.isConnected();
            if (isConnected) {
              const files = await app.googleService.listDocuments(5).catch(() => []);
              return {
                success: true,
                blocks: [
                  {
                    type: 'card',
                    title: 'GOOGLE DOCS / DRIVE (OAUTH 2.0)',
                    subtitle: 'Conexión oficial autorizada con permisos mínimos de lectura',
                    statusBadge: 'CONECTADO',
                    statusColor: '#28A745',
                    fields: [
                      { label: 'Estado', value: 'Autorizado y conectado' },
                      { label: 'Permisos', value: 'Solo lectura de documentos y metadatos de Drive' },
                      { label: 'Documentos recientes', value: files.length > 0 ? files.map((f: any) => f.name).join(', ') : 'Sin documentos recientes' },
                      { label: 'Importación', value: 'Ejecuta /chapter import google:<docId> para importar un documento' },
                    ],
                  },
                ],
                message: 'Google Docs está conectado y listo para importar novelas y capítulos.',
              };
            }

            const { authUrl, waitForAuth } = await app.googleService.initiateAuth();

            // Abrir navegador si no estamos en entorno de prueba
            if (env.NODE_ENV !== 'test') {
              if (process.platform === 'win32') {
                Bun.spawn(['cmd', '/c', 'start', '""', authUrl], { detached: true });
              } else if (process.platform === 'darwin') {
                Bun.spawn(['open', authUrl], { detached: true });
              } else {
                Bun.spawn(['xdg-open', authUrl], { detached: true });
              }

              // Esperar en segundo plano
              waitForAuth().then((success) => {
                if (success) {
                  app.connRepo.setConnected('google', 'Google Docs / Drive', true, 'Cuenta Google Autorizada');
                }
              }).catch(() => {});
            }

            return {
              success: true,
              blocks: [
                {
                  type: 'card',
                  title: 'AUTORIZACIÓN DE GOOGLE DOCS (OAUTH 2.0)',
                  subtitle: 'Permisos mínimos necesarios para seleccionar e importar documentos',
                  statusBadge: 'AUTORIZACIÓN PENDIENTE',
                  statusColor: '#FF6122',
                  fields: [
                    { label: 'URL de Autorización', value: authUrl },
                    { label: 'Alcance', value: 'documents.readonly, drive.readonly' },
                    { label: 'Instrucciones', value: 'Inicia sesión en Google y autoriza la lectura de documentos.' },
                  ],
                },
              ],
              message: 'Se ha abierto la página de autorización de Google Docs en tu navegador.',
            };
          } catch (err: any) {
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Error al conectar Google Docs',
                  content: `No se pudo iniciar el flujo de autorización OAuth: ${err.message}`,
                },
              ],
            };
          }
        }

        // /connect docs: Explorar manuscritos disponibles en disco y Google Drive
        if (target === 'docs') {
          const docsDir = defaultConfig.docsDir;
          const localFiles: string[] = [];

          if (fs.existsSync(docsDir)) {
            const entries = fs.readdirSync(docsDir, { recursive: true }) as string[];
            for (const entry of entries) {
              const fullPath = path.join(docsDir, String(entry));
              if (fs.statSync(fullPath).isFile() && (fullPath.endsWith('.docx') || fullPath.endsWith('.txt'))) {
                localFiles.push(path.relative(docsDir, fullPath));
              }
            }
          }

          let googleDocsList: any[] = [];
          const isGoogleConnected = await app.googleService.isConnected().catch(() => false);
          if (isGoogleConnected) {
            googleDocsList = await app.googleService.listDocuments(10).catch(() => []);
          }

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'ADMINISTRADOR DE DOCUMENTOS — MANUSCRITOS DISPONIBLES',
                subtitle: `Directorio local: ${docsDir}`,
                statusBadge: `${localFiles.length + googleDocsList.length} DOCUMENTOS`,
                statusColor: '#17A2B8',
                fields: [
                  {
                    label: 'Documentos Locales (.docx / .txt)',
                    value: localFiles.length > 0 ? localFiles.slice(0, 10).join('\n') : 'No hay documentos en la carpeta local de novelas.',
                  },
                  {
                    label: 'Documentos en Google Drive',
                    value: isGoogleConnected
                      ? (googleDocsList.length > 0 ? googleDocsList.map((g) => `${g.name} [ID: ${g.id}]`).join('\n') : 'No se encontraron documentos en Google Drive.')
                      : 'Google Docs no conectado (usa /connect google).',
                  },
                  {
                    label: 'Cómo importar',
                    value: 'Usa /chapter import <ruta_archivo> o /chapter import google:<id>',
                  },
                ],
              },
            ],
          };
        }

        // /connect (Resumen general del Administrador de Documentos)
        const isGoogleConnected = await app.googleService.isConnected().catch(() => false);
        const wattpadUser = await app.wattpadService.getProfile();
        const docsDir = defaultConfig.docsDir;

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'ADMINISTRADOR DE DOCUMENTOS Y CUENTA WATTPAD',
              subtitle: 'Gestión exclusiva de novelas, capítulos, documentos y publicaciones',
              statusBadge: wattpadUser ? `@${wattpadUser.username}` : 'MODO LOCAL',
              statusColor: wattpadUser ? '#28A745' : '#808080',
              fields: [
                {
                  label: 'Cuenta Wattpad',
                  value: wattpadUser ? `@${wattpadUser.username} (Conectada)` : 'Sin conectar (Usa /login)',
                },
                {
                  label: 'Microsoft Word (.docx)',
                  value: `Activo · Directorio: ${docsDir}`,
                },
                {
                  label: 'Bloc de Notas (.txt)',
                  value: `Activo · Codificación UTF-8 · Directorio: ${docsDir}`,
                },
                {
                  label: 'Google Docs / Drive',
                  value: isGoogleConnected ? 'Conectado (OAuth 2.0 Lectura)' : 'Desconectado (Usa /connect google)',
                },
              ],
            },
          ],
        };
      },
    },

    {
      name: '/disconnect',
      subcommands: ['google', 'word', 'notepad'],
      category: 'connections',
      description: 'Desconecta una integración externa',
      descriptionEn: 'Disconnects an external integration',
      usage: '/disconnect [google | word | notepad]',
      examples: ['/disconnect google'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const target = parsed.subcommand as 'google' | 'word' | 'notepad';

        if (!target || !['google', 'word', 'notepad'].includes(target)) {
          return {
            success: false,
            blocks: [{ type: 'error', title: 'Objetivo requerido', content: 'Uso: /disconnect [google | word | notepad]' }],
          };
        }

        if (target === 'google') {
          await app.googleService.disconnect();
          app.connRepo.setConnected('google', 'Google Docs / Drive', false);
        } else {
          app.connRepo.setConnected(target, target, false);
        }

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
                content: 'No tienes novelas disponibles en esta cuenta.\nUsa /story new para crear tu primera novela.',
              },
            ],
          };
        }

        const blocks: RenderBlock[] = [
          {
            type: 'card',
            title: 'ORGANIZACIÓN DE NOVELAS Y DOCUMENTOS',
            subtitle: `${stories.length} obra(s) catalogada(s)`,
            statusBadge: 'BIBLIOTECA DOCUMENTAL',
            statusColor: '#FF6122',
          },
        ];

        for (const story of stories) {
          const chapters = app.chapterRepo.findByStoryId(story.id);
          blocks.push({
            type: 'card',
            title: `${story.title} [${story.id}]`,
            subtitle: `Editor preferido: ${story.editorPreference.toUpperCase()} | Género: ${story.genre}`,
            statusBadge: `${chapters.length} CAPÍTULOS`,
            statusColor: '#17A2B8',
            fields: [
              {
                label: 'Capítulos detectados',
                value: chapters.length > 0 ? chapters.map((c: any) => `Cap. ${c.chapterNumber}: ${c.title}`).join('\n') : 'Sin capítulos aún',
              },
            ],
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
