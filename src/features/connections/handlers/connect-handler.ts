import fs from 'fs';
import path from 'path';
import { CommandDefinition, CommandResult, ParsedCommand, RenderBlock } from '../../../core/types/command.types';
import { defaultConfig } from '../../../core/config/config';
import { env } from '../../../core/config/env';
import { InteractiveMenuView, MenuItem } from '../../../platform/terminal/interactive';

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
              const profile = await app.googleService.getAccountProfile();
              const files = await app.googleService.listDocuments(5).catch(() => []);
              return {
                success: true,
                blocks: [
                  {
                    type: 'card',
                    title: 'GOOGLE DOCS / DRIVE (OAUTH 2.0)',
                    subtitle: profile?.email ? `Cuenta conectada: ${profile.email}` : 'Conexión oficial autorizada con permisos mínimos de lectura',
                    statusBadge: 'CONECTADO',
                    statusColor: '#28A745',
                    fields: [
                      { label: 'Cuenta', value: profile?.email || 'Cuenta Google Autorizada' },
                      { label: 'Estado', value: 'Conectado mediante OAuth 2.0 Desktop PKCE' },
                      { label: 'Permisos', value: 'documents.readonly, drive.metadata.readonly' },
                      {
                        label: 'Documentos recientes',
                        value: files.length > 0 ? files.map((f: any) => `• ${f.name} [ID: ${f.id}]`).join('\n') : 'Sin documentos recientes en Google Drive',
                      },
                      { label: 'Comandos disponibles', value: '/google documents · /google status · /disconnect google' },
                      { label: 'Importación', value: 'Ejecuta /chapter import google:<docId> para importar un documento' },
                    ],
                  },
                ],
                message: `Google Docs conectado como ${profile?.email || 'usuario autor'}.`,
              };
            }

            const { authUrl, browserFound, browserPath, waitForAuth } = await app.googleService.initiateAuth({
              onBrowserLaunched: (url, browser) => {
                if (app.appShell && typeof (app.appShell as any).setNotification === 'function') {
                  (app.appShell as any).setNotification(
                    browser ? `Abriendo navegador dedicado (${path.basename(browser)}) para Google OAuth...` : 'Abriendo autorización de Google Docs...'
                  );
                }
              },
            });

            // Esperar en segundo plano la respuesta del servidor loopback local
            waitForAuth().then(async (success) => {
              if (success) {
                const profile = await app.googleService.getAccountProfile();
                app.connRepo.setConnected('google', 'Google Docs / Drive', true, profile?.email || 'Cuenta Google');
                if (app.appShell && typeof (app.appShell as any).setNotification === 'function') {
                  (app.appShell as any).setNotification(`✓ Google Docs conectado exitosamente como ${profile?.email || 'usuario autor'}.`);
                }
              }
            }).catch(() => {});

            return {
              success: true,
              blocks: [
                {
                  type: 'card',
                  title: 'AUTORIZACIÓN DE GOOGLE DOCS (OAUTH 2.0 DESKTOP PKCE)',
                  subtitle: 'Permisos mínimos necesarios para seleccionar e importar documentos',
                  statusBadge: 'AUTORIZACIÓN PENDIENTE',
                  statusColor: '#FF6122',
                  fields: [
                    { label: 'Navegador Dedicado', value: browserFound ? `Detectado: ${browserPath}` : 'No se detectó Chrome/Edge. Copia la URL en tu navegador.' },
                    { label: 'Perfil Independiente', value: 'Aislado en profiles/google/ (No interfiere con Wattpad)' },
                    { label: 'Flujo de Seguridad', value: 'Desktop App Loopback (RFC 8252) con PKCE S256' },
                    { label: 'URL de Autorización', value: authUrl },
                    { label: 'Instrucciones', value: 'Completa la autorización en la ventana del navegador. La terminal detectará la conexión automáticamente.' },
                  ],
                },
              ],
              message: 'Se ha abierto la página de autorización de Google Docs en un navegador dedicado e independiente.',
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

        if (app.appShell) {
          const items: MenuItem[] = [
            {
              id: 'word',
              label: '1. Microsoft Word',
              description: 'Importar y exportar archivos .docx nativos',
              badge: 'LOCAL',
              action: () => {
                const cmd = app.registry.get('/connect');
                if (cmd) cmd.execute(app, { command: '/connect word', subcommand: 'word', args: [], flags: {} });
              },
            },
            {
              id: 'notepad',
              label: '2. Bloc de Notas',
              description: 'Archivos .txt simples en codificación UTF-8',
              badge: 'LOCAL',
              action: () => {
                const cmd = app.registry.get('/connect');
                if (cmd) cmd.execute(app, { command: '/connect notepad', subcommand: 'notepad', args: [], flags: {} });
              },
            },
            {
              id: 'google',
              label: '3. Google Docs',
              description: 'Sincronizar manuscritos con Google Drive mediante OAuth 2.0',
              badge: isGoogleConnected ? 'CONECTADO' : 'DESCONECTADO',
              action: () => {
                const cmd = app.registry.get('/connect');
                if (cmd) cmd.execute(app, { command: '/connect google', subcommand: 'google', args: [], flags: {} });
              },
            },
            {
              id: 'wattpad',
              label: '4. Sesión de Wattpad',
              description: wattpadUser ? `Conectado como @${wattpadUser.username}` : 'Conectar cuenta oficial de Wattpad',
              badge: wattpadUser ? 'CONECTADO' : 'DESCONECTADO',
              action: () => {
                const loginCmd = app.registry.get('/login');
                if (loginCmd) loginCmd.execute(app, { command: '/login', args: [], flags: {} });
              },
            },
          ];
          app.appShell.pushView(
            new InteractiveMenuView({
              id: 'connections-manager',
              title: 'INTEGRACIONES Y CONEXIONES',
              subtitle: 'Panel interactivo de servicios y formatos con 4 flechas',
              items,
            })
          );
        }

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
          message: `La integración con ${target} ha sido desconectada exitosamente.`,
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

    {
      name: '/google',
      subcommands: ['status', 'documents', 'docs', 'disconnect'],
      category: 'connections',
      description: 'Administra la conexión y documentos de Google Docs',
      descriptionEn: 'Manages Google Docs connection and documents',
      usage: '/google [status | documents | disconnect]',
      examples: ['/google status', '/google documents', '/google disconnect'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const sub = (parsed.subcommand || parsed.args[0] || 'status').toLowerCase();

        if (sub === 'disconnect') {
          await app.googleService.disconnect();
          app.connRepo.setConnected('google', 'Google Docs / Drive', false);
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'GOOGLE DOCS DESCONECTADO',
                subtitle: 'Tokens y sesión revocados',
                statusBadge: 'DESCONECTADO',
                statusColor: '#808080',
                content: 'La conexión con Google Docs ha sido revocada de forma segura. Tu cuenta Wattpad y archivos locales permanecen intactos.',
              },
            ],
            message: 'Google Docs desconectado exitosamente.',
          };
        }

        if (sub === 'documents' || sub === 'docs') {
          const isConnected = await app.googleService.isConnected();
          if (!isConnected) {
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Google Docs no conectado',
                  content: 'Para consultar tus documentos de Google Docs primero debes conectar tu cuenta con /connect google.',
                },
              ],
              message: 'Google Docs no conectado. Usa /connect google.',
            };
          }

          try {
            const docs = await app.googleService.listDocuments(20);
            const profile = await app.googleService.getAccountProfile();

            if (docs.length === 0) {
              return {
                success: true,
                blocks: [
                  {
                    type: 'card',
                    title: 'GOOGLE DOCS — MIS DOCUMENTOS',
                    subtitle: profile?.email ? `Cuenta: ${profile.email}` : 'Google Drive',
                    statusBadge: '0 DOCUMENTOS',
                    statusColor: '#808080',
                    content: 'No se encontraron documentos de texto en tu unidad de Google Drive.',
                  },
                ],
                message: 'No se encontraron documentos en Google Drive.',
              };
            }

            const blocks: RenderBlock[] = [
              {
                type: 'card',
                title: 'GOOGLE DOCS — DOCUMENTOS DISPONIBLES',
                subtitle: profile?.email ? `Cuenta: ${profile.email} · ${docs.length} documento(s)` : `${docs.length} documento(s)`,
                statusBadge: `${docs.length} DOCUMENTOS`,
                statusColor: '#28A745',
              },
            ];

            for (const doc of docs) {
              blocks.push({
                type: 'card',
                title: doc.name,
                subtitle: `ID: ${doc.id}`,
                statusBadge: 'GOOGLE DOC',
                statusColor: '#4285F4',
                fields: [
                  { label: 'Identificador', value: doc.id },
                  {
                    label: 'Última modificación',
                    value: doc.modifiedTime ? new Date(doc.modifiedTime).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No disponible',
                  },
                  { label: 'Cómo importar', value: `/chapter import google:${doc.id}` },
                  { label: 'Enlace', value: `https://docs.google.com/document/d/${doc.id}/edit` },
                ],
              });
            }

            return {
              success: true,
              blocks,
              message: `Se encontraron ${docs.length} documentos en Google Drive.`,
            };
          } catch (err: any) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'Error al consultar Google Docs', content: err.message }],
            };
          }
        }

        // Caso /google status
        const isConnected = await app.googleService.isConnected();
        const profile = await app.googleService.getAccountProfile();

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'ESTADO DE CONEXIÓN CON GOOGLE DOCS',
              subtitle: isConnected ? `Conectado como ${profile?.email || 'Cuenta Google'}` : 'Sin conexión autorizada',
              statusBadge: isConnected ? 'CONECTADO' : 'DESCONECTADO',
              statusColor: isConnected ? '#28A745' : '#808080',
              fields: [
                { label: 'Cuenta', value: profile?.email || (isConnected ? 'Cuenta Autorizada' : 'No conectada') },
                { label: 'Estado', value: isConnected ? 'Sesión activa mediante OAuth 2.0 Desktop PKCE' : 'Desconectado (Ejecuta /connect google)' },
                { label: 'Permisos', value: isConnected ? 'Lectura de documentos y metadatos de Drive' : 'Ninguno' },
                { label: 'Comandos disponibles', value: isConnected ? '/google documents · /disconnect google' : '/connect google' },
              ],
            },
          ],
        };
      },
    },

    {
      name: '/conectar',
      subcommands: ['word', 'notepad', 'google', 'docs', 'wattpad', 'status'],
      category: 'connections',
      description: 'Administra integraciones con Word, Bloc de Notas y Google Docs',
      descriptionEn: 'Manages integrations with Word, Notepad and Google Docs',
      usage: '/conectar [word | notepad | google | docs | status]',
      examples: ['/conectar', '/conectar word', '/conectar google'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const cmd = app.registry.get('/connect');
        if (cmd) return await cmd.execute(app, parsed);
        return { success: false, message: 'Comando no disponible' };
      },
    },
  ];
}
