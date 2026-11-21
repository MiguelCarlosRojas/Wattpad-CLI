import path from 'path';
import { CommandDefinition, CommandResult, ParsedCommand, RenderBlock } from '../../../core/types/command.types';
import { formatStatusBadge } from '../../../core/utils/formatter';
import { DocumentParser, DocumentParseResult } from '../../manuscripts/parsers/document-parser';
import { InteractiveChapterView, InteractiveImportView } from '../../../platform/terminal/interactive';

export function createChapterCommands(): CommandDefinition[] {
  return [
    {
      name: '/chapters',
      category: 'chapters',
      description: 'Lista todos los capítulos de la novela activa con su estado, palabras y versiones',
      descriptionEn: 'Lists all chapters of the active story with their status, word count, and versions',
      usage: '/chapters [NOV-xxxx]',
      examples: ['/chapters', '/chapters NOV-0001'],
      execute: (app, parsed: ParsedCommand): CommandResult => {
        const storyId = parsed.subcommand || parsed.args[0] || app.currentStoryId;

        if (!storyId) {
          return {
            success: false,
            blocks: [
              {
                type: 'error',
                title: 'Novela no especificada',
                content:
                  'Debes abrir una novela con /story open NOV-xxxx o especificar el identificador.\n' +
                  'Ejemplo: /chapters NOV-0001',
              },
            ],
            message: 'Abre una novela con /story open NOV-xxxx para listar sus capítulos.',
          };
        }

        const story = app.storyRepo.findById(storyId);
        if (!story) {
          return {
            success: false,
            blocks: [{ type: 'error', title: 'Novela no encontrada', content: `No existe la novela "${storyId}".` }],
          };
        }

        const chapters = app.chapterRepo.findByStoryId(story.id);

        if (chapters.length === 0) {
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: `CAPÍTULOS DE: ${story.title}`,
                subtitle: `ID: ${story.id}`,
                statusBadge: '0 CAPÍTULOS',
                statusColor: '#808080',
                content: 'Esta novela aún no tiene capítulos creados.\nUsa /chapter create "Título" o /chapter import <archivo> para incorporar capítulos.',
              },
            ],
            message: 'Esta novela no tiene capítulos creados aún.',
          };
        }

        // Si se solicita el modo selector interactivo con 4 flechas
        if (parsed.flags.select || parsed.subcommand === 'select') {
          if (app.appShell && typeof app.appShell.openItemSelector === 'function') {
            app.appShell.openItemSelector({
              title: `CAPÍTULOS: ${story.title}`,
              subtitle: `Total: ${chapters.length} capítulo(s) · Navega con ↑/↓ y pulsa Enter para ver acciones`,
              selectedIndex: 0,
              items: chapters.map((ch) => ({
                id: ch.id,
                title: `Capítulo ${ch.chapterNumber}: ${ch.title}`,
                subtitle: `${ch.wordCount.toLocaleString()} palabras · ${ch.status === 'published' ? 'Publicado' : 'Borrador'}`,
                badge: ch.status === 'published' ? 'PUBLICADO' : 'BORRADOR',
                badgeColor: ch.status === 'published' ? '#32D583' : '#808080',
                data: ch,
              })),
              width: 80,
              onAction: async (actionId: string, item: any) => {
                const targetChapter = app.chapterRepo.findById(item.id);
                if (!targetChapter) return;

                if (actionId === 'cli_edit') {
                  app.appShell.openTextEditor({
                    title: `${targetChapter.title} [${targetChapter.id}]`,
                    content: targetChapter.content || '',
                    onSave: (newContent: string) => {
                      app.chapterRepo.update(targetChapter.id, {
                        content: newContent,
                        wordCount: newContent.split(/\s+/).filter(Boolean).length,
                      });
                    },
                  });
                } else if (actionId === 'open_word') {
                  const { filePath } = await app.wordService.exportChapterToDocx(story, targetChapter);
                  if (process.platform === 'win32') {
                    Bun.spawn(['cmd', '/c', 'start', '""', filePath]);
                  }
                  app.appShell.setNotification(`Abierto en Microsoft Word: ${path.basename(filePath)}`);
                } else if (actionId === 'open_notepad') {
                  const { filePath } = app.notepadService.exportChapterToTxt(story, targetChapter);
                  if (process.platform === 'win32') {
                    Bun.spawn(['notepad.exe', filePath]);
                  }
                  app.appShell.setNotification(`Abierto en Bloc de Notas: ${path.basename(filePath)}`);
                } else if (actionId === 'open_google') {
                  const isConn = await app.googleService.isConnected();
                  if (isConn) {
                    app.appShell.setNotification(`Sincronizado con Google Docs.`);
                  } else {
                    app.appShell.setNotification('Google Docs no está conectado. Usa /connect google.');
                  }
                } else if (actionId === 'view_content') {
                  app.appShell.setNotification(`Capítulo: ${targetChapter.title} (${targetChapter.wordCount} palabras)`);
                }
              },
            });

            return {
              success: true,
              message: `Selector interactivo abierto para "${story.title}".`,
            };
          }
        }

        const blocks: RenderBlock[] = [
          {
            type: 'card',
            title: `CAPÍTULOS: ${story.title} [${story.id}]`,
            subtitle: `Total: ${chapters.length} capítulo(s) registrados`,
            statusBadge: `${chapters.length} CAPÍTULOS`,
            statusColor: '#FF6122',
          },
        ];

        for (const ch of chapters) {
          const badge = formatStatusBadge(ch.status);

          blocks.push({
            type: 'card',
            title: `Capítulo ${ch.chapterNumber}: ${ch.title} [${ch.id}]`,
            subtitle: ch.content ? ch.content.slice(0, 80) + '...' : '(Sin contenido redactado)',
            statusBadge: badge.text,
            statusColor: badge.color,
            fields: [
              { label: 'Palabras', value: `${ch.wordCount.toLocaleString()} palabras` },
              { label: 'Estado de publicación', value: ch.status === 'published' ? 'Publicado en Wattpad' : 'Borrador Privado' },
              { label: 'Identificador Wattpad', value: ch.wattpadId || 'Pendiente' },
              { label: 'Última modificación', value: ch.updatedAt ? ch.updatedAt.slice(0, 16).replace('T', ' ') : 'Reciente' },
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
      name: '/chapter',
      subcommands: ['create', 'new', 'open', 'edit', 'delete', 'import', 'publish', 'status', 'select'],
      category: 'chapters',
      description: 'Crea, edita, elimina, importa desde documentos, consulta estado y publica capítulos',
      descriptionEn: 'Create, edit, delete, import from documents, check status and publish chapters',
      usage: '/chapter [create <título> | edit CAP-xxxx | delete CAP-xxxx | import <ruta> | publish CAP-xxxx | status CAP-xxxx]',
      examples: [
        '/chapter create "Capítulo 1: El Despertar"',
        '/chapter edit CAP-0001 --title="Nuevo Título"',
        '/chapter delete CAP-0001 --confirm',
        '/chapter import ./manuscrito.docx',
        '/chapter import ./manuscrito.docx --confirm',
        '/chapter publish CAP-0001 --confirm',
        '/chapter status CAP-0001',
      ],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        let sub = parsed.subcommand;
        let targetArg = parsed.args[0];

        // Si el usuario escribe `/chapter CAP-0001`, tratarlo como `/chapter status CAP-0001`
        if (sub && sub.startsWith('CAP-')) {
          targetArg = sub;
          sub = 'status';
        }

        // Si no hay subcomando pero hay capítulo activo, mostrar status
        if (!sub && app.currentChapterId) {
          sub = 'status';
          targetArg = app.currentChapterId;
        } else if (!sub) {
          const activeStory = app.currentStoryId ? app.storyRepo.findById(app.currentStoryId) : app.storyRepo.findAll()[0];
          const chapters = activeStory ? app.chapterRepo.findByStoryId(activeStory.id) : [];

          if (app.appShell && activeStory) {
            app.appShell.pushView(
              new InteractiveChapterView({
                storyTitle: activeStory.title,
                chapters,
                onAction: async (actionId, chap) => {
                  if (actionId === 'editor') {
                    app.appShell.openTextEditor({
                      title: `${chap.title} [${chap.id}]`,
                      content: chap.content || '',
                      onSave: (newContent: string) => {
                        app.chapterRepo.update(chap.id, {
                          content: newContent,
                          wordCount: newContent.split(/\s+/).filter(Boolean).length,
                        });
                      },
                    });
                  } else if (actionId === 'external') {
                    const { filePath } = await app.wordService.exportChapterToDocx(activeStory, chap);
                    if (process.platform === 'win32') {
                      Bun.spawn(['cmd', '/c', 'start', '""', filePath]);
                    }
                    app.appShell.setNotification(`Abierto en Word: ${path.basename(filePath)}`);
                  }
                },
              })
            );
          }

          return {
            success: false,
            blocks: [
              {
                type: 'card',
                title: 'GESTIÓN DE CAPÍTULOS',
                subtitle: 'Comandos disponibles',
                statusBadge: 'AYUDA',
                statusColor: '#FF6122',
                content:
                  'Comandos disponibles para gestionar capítulos:\n' +
                  '› /chapter create <título>        Crea un nuevo capítulo\n' +
                  '› /chapter edit CAP-xxxx          Modifica el título o contenido\n' +
                  '› /chapter delete CAP-xxxx        Elimina el capítulo con confirmación\n' +
                  '› /chapter import <archivo>       Importa y segmenta documentos (.docx, .txt, Google Docs)\n' +
                  '› /chapter publish CAP-xxxx       Publica el capítulo en Wattpad con confirmación\n' +
                  '› /chapter status CAP-xxxx        Consulta el estado de publicación real\n' +
                  '› /chapters                       Lista todos los capítulos de la novela activa',
              },
            ],
          };
        }

        // /chapter create o /chapter new
        if (sub === 'create' || sub === 'new') {
          let storyId = app.currentStoryId;
          let title = (parsed.flags.title as string) || '';

          if (parsed.args.length >= 2 && parsed.args[0].startsWith('NOV-')) {
            storyId = parsed.args[0];
            title = title || parsed.args.slice(1).join(' ');
          } else if (parsed.args.length >= 1) {
            title = title || parsed.args.join(' ');
          }

          if (!storyId) {
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Novela no seleccionada',
                  content:
                    'Debes abrir una novela con /story open NOV-xxxx antes de crear capítulos,\n' +
                    'o indicar el ID: /chapter create NOV-0001 "Título del capítulo"',
                },
              ],
            };
          }

          if (!title) {
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Título requerido',
                  content: 'Indica el título del nuevo capítulo.\nEjemplo: /chapter create "Capítulo 1: Comienzo"',
                },
              ],
            };
          }

          const story = app.storyRepo.findById(storyId);
          if (!story) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'Novela no encontrada', content: `No existe la novela "${storyId}".` }],
            };
          }

          const chapter = app.chapterRepo.create({
            storyId: story.id,
            title,
            content: (parsed.flags.content as string) || '',
            status: 'draft',
          });

          app.currentChapterId = chapter.id;

          // Generar archivo externo correspondiente
          if (story.editorPreference === 'word') {
            await app.wordService.exportChapterToDocx(story, chapter).catch(() => {});
          } else if (story.editorPreference === 'notepad') {
            app.notepadService.exportChapterToTxt(story, chapter);
          }

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: '¡CAPÍTULO CREADO CON ÉXITO!',
                subtitle: `${chapter.title} [${chapter.id}]`,
                statusBadge: '[BORRADOR PRIVADO]',
                statusColor: '#808080',
                fields: [
                  { label: 'Novela', value: `${story.title} [${story.id}]` },
                  { label: 'Número de capítulo', value: `Capítulo ${chapter.chapterNumber}` },
                  { label: 'Identificador', value: chapter.id },
                  { label: 'Estado', value: 'Borrador privado (no publicado en Wattpad)' },
                  { label: 'Editor Preferido', value: story.editorPreference.toUpperCase() },
                ],
              },
            ],
            message: `Capítulo ${chapter.id} creado exitosamente como borrador privado.`,
          };
        }

        // /chapter import <ruta_o_docId>
        if (sub === 'import') {
          const filePathOrId = parsed.args[0] || (parsed.flags.file as string) || (parsed.flags.path as string);
          const isConfirmed = Boolean(parsed.flags.confirm || parsed.flags.c);
          const targetStoryId = (parsed.flags.story as string) || app.currentStoryId;

          if (!targetStoryId) {
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Novela de destino requerida',
                  content:
                    'Debes tener una novela abierta o indicar la novela de destino.\n' +
                    'Ejemplo: /story open NOV-0001 y luego /chapter import <archivo>',
                },
              ],
            };
          }

          const story = app.storyRepo.findById(targetStoryId);
          if (!story) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'Novela no encontrada', content: `No existe la novela "${targetStoryId}".` }],
            };
          }

          if (!filePathOrId) {
            if (app.appShell) {
              app.appShell.pushView(
                new InteractiveImportView({
                  stories: app.storyRepo.findAll(),
                  onConfirmImport: async (src, filePath, storyId) => {
                    app.appShell.setNotification(`✓ Importación guiada iniciada: ${path.basename(filePath)}`);
                  },
                })
              );
            }

            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Ruta de archivo requerida',
                  content:
                    'Indica la ruta del archivo Word (.docx), Bloc de Notas (.txt) o ID de Google Docs.\n' +
                    'Ejemplo:\n› /chapter import ./manuscrito.docx\n› /chapter import google:<docId>',
                },
              ],
            };
          }

          let parseResult: DocumentParseResult;

          try {
            if (filePathOrId.startsWith('google:')) {
              const docId = filePathOrId.replace(/^google:/, '').trim();
              parseResult = await app.googleService.importDocument(docId);
            } else {
              parseResult = await DocumentParser.parseFile(path.resolve(process.cwd(), filePathOrId));
            }
          } catch (err: any) {
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Error al leer el documento',
                  content: err.message,
                },
              ],
            };
          }

          // PASO 1: Si no está confirmado, mostrar VISTA PREVIA DETALLADA
          if (!isConfirmed) {
            const previewItems = parseResult.chapters.slice(0, 8).map((ch) => ({
              primary: `Capítulo ${ch.chapterNumber}: ${ch.title} (${ch.wordCount.toLocaleString()} palabras)`,
              secondary: ch.preview,
              badge: 'DETECTADO',
            }));

            return {
              success: true,
              blocks: [
                {
                  type: 'card',
                  title: `VISTA PREVIA DE IMPORTACIÓN: "${parseResult.filename}"`,
                  subtitle: `Novela de destino: ${story.title} [${story.id}]`,
                  statusBadge: `${parseResult.chapters.length} CAPÍTULOS DETECTADOS`,
                  statusColor: '#17A2B8',
                  fields: [
                    { label: 'Archivo origen', value: parseResult.sourcePath },
                    { label: 'Formato', value: parseResult.format.toUpperCase() },
                    { label: 'Capítulos detectados', value: `${parseResult.chapters.length} capítulo(s)` },
                    { label: 'Palabras totales', value: `${parseResult.totalWords.toLocaleString()} palabras` },
                    { label: 'Estado previsto', value: 'Se guardarán como borradores privados locales' },
                    { label: 'Publicación', value: 'NO se publicará nada automáticamente en Wattpad' },
                  ],
                  items: previewItems,
                  content:
                    `Se detectaron ${parseResult.chapters.length} capítulos en el documento.\n\n` +
                    'Para confirmar la importación e incorporar estos capítulos a tu novela, ejecuta:\n' +
                    `› /chapter import "${filePathOrId}" --confirm`,
                },
              ],
              message: `Vista previa: ${parseResult.chapters.length} capítulos detectados. Ejecuta con --confirm para importar.`,
            };
          }

          // PASO 2: Confirmación aprobada por el usuario — Crear los capítulos como borradores
          const createdChapters: any[] = [];
          const existingCount = app.chapterRepo.findByStoryId(story.id).length;

          for (let i = 0; i < parseResult.chapters.length; i++) {
            const chData = parseResult.chapters[i];
            const created = app.chapterRepo.create({
              storyId: story.id,
              title: chData.title,
              content: chData.content,
              chapterNumber: existingCount + i + 1,
              status: 'draft',
            });
            createdChapters.push(created);

            // Exportar a la estructura local
            if (story.editorPreference === 'word') {
              await app.wordService.exportChapterToDocx(story, created).catch(() => {});
            } else if (story.editorPreference === 'notepad') {
              app.notepadService.exportChapterToTxt(story, created);
            }
          }

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: '¡IMPORTACIÓN DOCUMENTAL CONFIRMADA!',
                subtitle: `Novela: ${story.title} [${story.id}]`,
                statusBadge: `${createdChapters.length} CAPÍTULOS INCORPORADOS`,
                statusColor: '#28A745',
                fields: [
                  { label: 'Archivo procesado', value: parseResult.filename },
                  { label: 'Capítulos importados', value: `${createdChapters.length} capítulo(s)` },
                  { label: 'Palabras totales', value: `${parseResult.totalWords.toLocaleString()} palabras` },
                  { label: 'Estado', value: 'Borradores privados en tu novela local' },
                  { label: 'Publicación', value: 'Borradores sin publicar en Wattpad. Usa /chapter publish cuando decidas publicar.' },
                ],
              },
            ],
            message: `¡Importación completada! ${createdChapters.length} capítulos incorporados a "${story.title}".`,
          };
        }

        // Helper para resolver IDs
        let storyId = app.currentStoryId;
        let chapterId = targetArg || app.currentChapterId;

        if (parsed.args.length >= 2 && parsed.args[0].startsWith('NOV-') && parsed.args[1].startsWith('CAP-')) {
          storyId = parsed.args[0];
          chapterId = parsed.args[1];
        } else if (targetArg && targetArg.startsWith('CAP-')) {
          chapterId = targetArg;
        }

        if (!chapterId) {
          return {
            success: false,
            blocks: [{ type: 'error', title: 'Identificador requerido', content: `Uso: /chapter ${sub} CAP-xxxx` }],
          };
        }

        const chapter = app.chapterRepo.findById(chapterId);
        if (!chapter) {
          return {
            success: false,
            blocks: [{ type: 'error', title: 'Capítulo no encontrado', content: `No existe el capítulo "${chapterId}".` }],
          };
        }

        const story = app.storyRepo.findById(chapter.storyId);

        // /chapter status CAP-xxxx
        if (sub === 'status' || sub === 'open') {
          app.currentChapterId = chapter.id;
          if (story) app.currentStoryId = story.id;

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: `ESTADO DE CAPÍTULO: ${chapter.title}`,
                subtitle: `Identificador: ${chapter.id} (Capítulo ${chapter.chapterNumber})`,
                statusBadge: chapter.status === 'published' ? 'PUBLICADO' : 'BORRADOR PRIVADO',
                statusColor: chapter.status === 'published' ? '#28A745' : '#808080',
                fields: [
                  { label: 'Novela asociada', value: story ? `${story.title} [${story.id}]` : chapter.storyId },
                  { label: 'Título', value: chapter.title },
                  { label: 'Número', value: `Capítulo ${chapter.chapterNumber}` },
                  { label: 'Palabras', value: `${chapter.wordCount.toLocaleString()} palabras` },
                  { label: 'Estado en Wattpad', value: chapter.status === 'published' ? 'Publicado' : 'Borrador Privado (no público)' },
                  { label: 'ID Wattpad', value: chapter.wattpadId || 'Pendiente' },
                ],
              },
            ],
            message: `Capítulo "${chapter.title}" [${chapter.id}] seleccionado.`,
          };
        }

        // /chapter edit CAP-xxxx
        if (sub === 'edit') {
          const updates: any = {};
          if (parsed.flags.title) updates.title = String(parsed.flags.title);
          if (parsed.flags.content) {
            updates.content = String(parsed.flags.content);
            updates.wordCount = updates.content.split(/\s+/).filter(Boolean).length;
          }

          if (Object.keys(updates).length === 0) {
            return {
              success: false,
              blocks: [
                {
                  type: 'warning',
                  title: 'Sin cambios indicados',
                  content: 'Indica los campos a modificar:\n› /chapter edit CAP-xxxx --title="Nuevo título" --content="..."',
                },
              ],
            };
          }

          const updated = app.chapterRepo.update(chapter.id, updates);

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'CAPÍTULO ACTUALIZADO',
                subtitle: `${updated.title} [${updated.id}]`,
                statusBadge: 'ACTUALIZADO',
                statusColor: '#28A745',
                fields: [
                  { label: 'Título', value: updated.title },
                  { label: 'Palabras', value: `${updated.wordCount} palabras` },
                ],
              },
            ],
            message: `Capítulo ${chapter.id} actualizado con éxito.`,
          };
        }

        // /chapter delete CAP-xxxx --confirm
        if (sub === 'delete') {
          const isConfirmed = Boolean(parsed.flags.confirm || parsed.flags.c);

          if (!isConfirmed) {
            return {
              success: false,
              blocks: [
                {
                  type: 'warning',
                  title: 'CONFIRMACIÓN OBLIGATORIA REQUERIDA',
                  subtitle: `Eliminar capítulo: "${chapter.title}" [${chapter.id}]`,
                  statusBadge: 'ACCIÓN IRREVERSIBLE',
                  statusColor: '#DC3545',
                  content:
                    `¿Estás seguro de que deseas eliminar el capítulo "${chapter.title}"?\n` +
                    'Para confirmar ejecuta:\n' +
                    `› /chapter delete ${chapter.id} --confirm`,
                },
              ],
              message: `Confirmación requerida. Usa /chapter delete ${chapter.id} --confirm para borrar.`,
            };
          }

          app.chapterRepo.delete(chapter.id);
          if (app.currentChapterId === chapter.id) {
            app.currentChapterId = null;
          }

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'CAPÍTULO ELIMINADO',
                subtitle: `"${chapter.title}" [${chapter.id}]`,
                statusBadge: 'ELIMINADO',
                statusColor: '#808080',
                content: `El capítulo "${chapter.title}" ha sido eliminado de tu novela local.`,
              },
            ],
            message: `Capítulo ${chapter.id} eliminado.`,
          };
        }

        // /chapter publish CAP-xxxx --confirm
        if (sub === 'publish') {
          const isConfirmed = Boolean(parsed.flags.confirm || parsed.flags.c);

          if (!isConfirmed) {
            return {
              success: false,
              blocks: [
                {
                  type: 'warning',
                  title: 'CONFIRMACIÓN DE PUBLICACIÓN EN WATTPAD',
                  subtitle: `Publicar capítulo: "${chapter.title}" [${chapter.id}]`,
                  statusBadge: 'CONFIRMACIÓN REQUERIDA',
                  statusColor: '#FF6122',
                  content:
                    `Estás a punto de hacer público el capítulo "${chapter.title}" en Wattpad.\n` +
                    'Los lectores podrán leer este capítulo.\n\n' +
                    'Para publicar ejecuta:\n' +
                    `› /chapter publish ${chapter.id} --confirm`,
                },
              ],
              message: `Confirmación requerida. Ejecuta /chapter publish ${chapter.id} --confirm para publicar.`,
            };
          }

          if (!story) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'Error', content: 'No se encontró la novela asociada al capítulo.' }],
            };
          }

          try {
            const pubRes = await app.wattpadService.publishChapter(story, chapter);
            app.chapterRepo.update(chapter.id, {
              status: 'published',
              wattpadId: pubRes.wattpadId,
            });

            return {
              success: true,
              blocks: [
                {
                  type: 'card',
                  title: '¡CAPÍTULO PUBLICADO CON ÉXITO EN WATTPAD!',
                  subtitle: `"${chapter.title}" [${chapter.id}]`,
                  statusBadge: 'PUBLICADO',
                  statusColor: '#28A745',
                  fields: [
                    { label: 'Novela', value: story.title },
                    { label: 'Capítulo', value: chapter.title },
                    { label: 'Identificador Wattpad', value: pubRes.wattpadId },
                    { label: 'Estado', value: 'Público en Wattpad' },
                  ],
                },
              ],
              message: pubRes.message,
            };
          } catch (err: any) {
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Error de publicación',
                  content: err.message,
                },
              ],
            };
          }
        }

        // /chapter select: abre selector interactivo
        if (sub === 'select') {
          const chaptersCmd = createChapterCommands().find((c) => c.name === '/chapters');
          if (chaptersCmd) {
            return chaptersCmd.execute(app, {
              ...parsed,
              flags: { ...parsed.flags, select: true },
            });
          }
        }

        return {
          success: false,
          blocks: [{ type: 'error', title: 'Subcomando no reconocido', content: 'Uso: /chapter [create | edit | delete | import | publish | status | select]' }],
        };
      },
    },

    {
      name: '/editor',
      category: 'chapters',
      description: 'Abre el editor de texto multilínea integrado en la terminal para editar un capítulo',
      descriptionEn: 'Opens the built-in terminal multiline text editor to edit a chapter',
      usage: '/editor [CAP-xxxx]',
      examples: ['/editor', '/editor CAP-0001'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const chapterId = parsed.subcommand || parsed.args[0] || app.currentChapterId;
        if (!chapterId) {
          return {
            success: false,
            blocks: [
              {
                type: 'error',
                title: 'Capítulo no seleccionado',
                content:
                  'Debes abrir un capítulo con /chapter open CAP-xxxx o indicar el ID para editar.\n' +
                  'Ejemplo: /editor CAP-0001',
              },
            ],
            message: 'Indica un capítulo para editar: /editor CAP-0001',
          };
        }

        const chapter = app.chapterRepo.findById(chapterId);
        if (!chapter) {
          return {
            success: false,
            blocks: [{ type: 'error', title: 'Capítulo no encontrado', content: `No existe el capítulo "${chapterId}".` }],
          };
        }

        if (app.appShell && typeof app.appShell.openTextEditor === 'function') {
          app.appShell.openTextEditor({
            title: `${chapter.title} [${chapter.id}]`,
            content: chapter.content || '',
            onSave: (newContent: string) => {
              app.chapterRepo.update(chapter.id, {
                content: newContent,
                wordCount: newContent.split(/\s+/).filter(Boolean).length,
              });
            },
          });
        }

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: `EDITOR EN TERMINAL: ${chapter.title}`,
              subtitle: `Identificador: ${chapter.id} · ${chapter.wordCount} palabras`,
              statusBadge: 'EDITOR ACTIVO',
              statusColor: '#32D583',
              fields: [
                { label: 'Capítulo', value: chapter.title },
                { label: 'Atajos', value: 'Ctrl+S: Guardar | Ctrl+F: Buscar | Esc: Salir' },
              ],
            },
          ],
          message: `Editor multilínea abierto para "${chapter.title}".`,
        };
      },
    },
  ];
}
