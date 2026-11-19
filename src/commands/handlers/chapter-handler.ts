import { CommandDefinition, CommandResult, ParsedCommand, RenderBlock } from '../../types/command.types';
import { formatStatusBadge } from '../../utils/formatter';

export function createChapterCommands(): CommandDefinition[] {
  return [
    {
      name: '/chapters',
      category: 'chapters',
      description: 'Lista todos los capítulos de una novela con su estado, palabras y versiones',
      descriptionEn: 'Lists all chapters of a story with their status, word count, and versions',
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
                  'Debes abrir una novela con /story open NOV-xxxx o especificar el ID.\n' +
                  'Ejemplo: /chapters NOV-0001',
              },
            ],
          };
        }

        const story = app.storyRepo.findById(storyId);
        if (!story) {
          return {
            success: false,
            blocks: [{ type: 'error', title: 'No encontrada', content: `No existe la novela "${storyId}".` }],
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
                content: 'Esta novela aún no tiene capítulos creados.\nUsa /chapter new para escribir el primer capítulo.',
              },
            ],
          };
        }

        const blocks: RenderBlock[] = [
          {
            type: 'card',
            title: `CAPÍTULOS: ${story.title} [${story.id}]`,
            subtitle: `Total: ${chapters.length} capítulo(s)`,
            statusBadge: `${chapters.length} CAPÍTULOS`,
            statusColor: '#FF6122',
          },
        ];

        for (const ch of chapters) {
          const badge = formatStatusBadge(ch.status);
          const versions = app.chapterRepo.getVersions(ch.id);

          blocks.push({
            type: 'card',
            title: `Capítulo ${ch.chapterNumber}: ${ch.title} [${ch.id}]`,
            subtitle: ch.content ? ch.content.slice(0, 80) + '...' : '(Sin contenido redactado aún)',
            statusBadge: badge.text,
            statusColor: badge.color,
            fields: [
              { label: 'Palabras', value: `${ch.wordCount.toLocaleString()} palabras` },
              { label: 'Versión actual', value: `v${versions.length}` },
              { label: 'Hash SHA-256', value: ch.contentHash.slice(0, 16) + '...' },
              { label: 'Última actualización', value: ch.updatedAt.slice(0, 16).replace('T', ' ') },
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
      subcommands: ['new', 'open', 'edit', 'import', 'export', 'delete', 'reorder', 'publish', 'unpublish'],
      category: 'chapters',
      description: 'Crea, abre, edita, importa, exporta, reordena, publica o despublica un capítulo',
      descriptionEn: 'Create, open, edit, import, export, reorder, publish or unpublish a chapter',
      usage: '/chapter [new | open | edit | import | export | delete | reorder | publish | unpublish]',
      examples: [
        '/chapter new "Capítulo 1: El Despertar"',
        '/chapter new NOV-0001 "Capítulo 2: El Encuentro"',
        '/chapter open NOV-0001 CAP-0001',
        '/chapter import NOV-0001 CAP-0001',
        '/chapter export NOV-0001 CAP-0001',
        '/chapter reorder NOV-0001 CAP-0001 --order=2',
        '/chapter publish NOV-0001 CAP-0001',
        '/chapter unpublish NOV-0001 CAP-0001',
        '/chapter delete NOV-0001 CAP-0001',
      ],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const sub = parsed.subcommand;

        // /chapter new
        if (sub === 'new') {
          let storyId = app.currentStoryId;
          let title = '';

          if (parsed.args.length >= 2 && parsed.args[0].startsWith('NOV-')) {
            storyId = parsed.args[0];
            title = parsed.args[1];
          } else if (parsed.args.length >= 1) {
            title = parsed.args[0];
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
                    'o indicar el ID: /chapter new NOV-0001 "Título del capítulo"',
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
                  content: 'Indica el título del nuevo capítulo.\nEjemplo: /chapter new "Capítulo 1: Comienzo"',
                },
              ],
            };
          }

          const story = app.storyRepo.findById(storyId);
          if (!story) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'No encontrada', content: `No existe la novela "${storyId}".` }],
            };
          }

          const chapter = app.chapterRepo.create({
            storyId: story.id,
            title,
            content: (parsed.flags.content as string) || '',
            status: 'draft',
          });

          app.currentChapterId = chapter.id;

          // Automatically generate external file according to story editor preference
          if (story.editorPreference === 'word') {
            await app.wordService.exportChapterToDocx(story, chapter);
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
                statusBadge: '[BORRADOR LOCAL]',
                statusColor: '#808080',
                fields: [
                  { label: 'Novela', value: `${story.title} [${story.id}]` },
                  { label: 'Número de capítulo', value: `Capítulo ${chapter.chapterNumber}` },
                  { label: 'Identificador', value: chapter.id },
                  { label: 'Editor Preferido', value: story.editorPreference.toUpperCase() },
                  { label: 'Estado', value: 'Borrador privado local (no publicado)' },
                ],
              },
            ],
            message: `Capítulo ${chapter.id} listo para escribir. Usa /chapter open ${story.id} ${chapter.id} para abrirlo en tu editor.`,
          };
        }

        // Helper to resolve storyId and chapterId from args
        let storyId = app.currentStoryId;
        let chapterId = app.currentChapterId;

        if (parsed.args.length >= 2 && parsed.args[0].startsWith('NOV-') && parsed.args[1].startsWith('CAP-')) {
          storyId = parsed.args[0];
          chapterId = parsed.args[1];
        } else if (parsed.args.length >= 1 && parsed.args[0].startsWith('CAP-')) {
          chapterId = parsed.args[0];
        } else if (parsed.args.length >= 1 && parsed.args[0].startsWith('NOV-')) {
          storyId = parsed.args[0];
        }

        if (!storyId || !chapterId) {
          return {
            success: false,
            blocks: [
              {
                type: 'error',
                title: 'Parámetros requeridos',
                content:
                  'Debes indicar la novela y el capítulo.\n' +
                  `Ejemplo: /chapter ${sub || 'open'} NOV-0001 CAP-0001`,
              },
            ],
          };
        }

        const story = app.storyRepo.findById(storyId);
        const chapter = app.chapterRepo.findById(chapterId);

        if (!story || !chapter) {
          return {
            success: false,
            blocks: [{ type: 'error', title: 'No encontrado', content: 'Novela o capítulo no encontrado.' }],
          };
        }

        // /chapter open
        if (sub === 'open') {
          app.currentStoryId = story.id;
          app.currentChapterId = chapter.id;

          const pref = story.editorPreference;
          let filePath = '';

          if (pref === 'word') {
            const exp = await app.wordService.exportChapterToDocx(story, chapter);
            filePath = exp.filePath;
          } else if (pref === 'notepad') {
            const exp = app.notepadService.exportChapterToTxt(story, chapter);
            filePath = exp.filePath;
          } else if (pref === 'google') {
            // Google Doc
            const res = await app.googleService.exportChapterToGoogleDoc(story, chapter);
            return {
              success: true,
              blocks: [
                {
                  type: 'success',
                  title: 'Google Doc abierto',
                  content: `Documento accesible en: ${res.docUrl}`,
                },
              ],
            };
          }

          await app.fsManager.openFileInOS(filePath, pref);

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: `ABRIENDO CAPÍTULO EN ${pref.toUpperCase()}`,
                subtitle: `${chapter.title} [${chapter.id}]`,
                statusBadge: 'EDITANDO',
                statusColor: '#FF6122',
                fields: [
                  { label: 'Archivo abierto', value: filePath },
                  { label: 'Instrucción', value: 'Escribe tu historia en tu editor y cuando termines usa /chapter import para guardar cambios.' },
                ],
              },
            ],
          };
        }

        // /chapter import
        if (sub === 'import') {
          const syncRes = await app.syncEngine.syncChapter(story.id, chapter.id, 'from_external');
          return {
            success: syncRes.success,
            blocks: [
              {
                type: syncRes.success ? 'success' : 'error',
                title: syncRes.success ? 'Capítulo importado' : 'Error al importar',
                content: syncRes.message,
              },
            ],
          };
        }

        // /chapter export
        if (sub === 'export') {
          const syncRes = await app.syncEngine.syncChapter(story.id, chapter.id, 'to_external');
          return {
            success: syncRes.success,
            blocks: [
              {
                type: 'success',
                title: 'Capítulo exportado',
                content: syncRes.message,
              },
            ],
          };
        }

        // /chapter edit
        if (sub === 'edit') {
          const content = parsed.args.slice(parsed.args[0].startsWith('NOV-') ? 2 : 1).join(' ') || (parsed.flags.content as string);
          if (!content) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'Contenido requerido', content: 'Indica el nuevo contenido del capítulo.' }],
            };
          }

          const updated = app.chapterRepo.update(chapter.id, { content }, 'cli');
          return {
            success: true,
            blocks: [
              {
                type: 'success',
                title: 'Capítulo actualizado',
                content: `Capítulo "${updated?.title}" actualizado. Palabras: ${updated?.wordCount}.`,
              },
            ],
          };
        }

        // /chapter delete
        if (sub === 'delete') {
          const isConfirmed = Boolean(parsed.flags.confirm || parsed.flags.c);
          if (!isConfirmed) {
            return {
              success: true,
              blocks: [
                {
                  type: 'warning',
                  title: 'CONFIRMACIÓN DE ELIMINACIÓN DE CAPÍTULO',
                  subtitle: `${chapter.title} [${chapter.id}]`,
                  statusBadge: 'ACCIÓN DESTRUCTIVA',
                  statusColor: '#DC3545',
                  content:
                    `¿Estás seguro de que deseas eliminar permanentemente el capítulo "${chapter.title}" [${chapter.id}] de la novela "${story.title}"?\n\n` +
                    'Esta acción no se puede deshacer.\n' +
                    'Para confirmar expresamente, escribe:\n' +
                    `› /chapter delete ${story.id} ${chapter.id} --confirm`,
                },
              ],
              message: `Confirmación requerida: usa /chapter delete ${story.id} ${chapter.id} --confirm para proceder.`,
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
                title: 'CAPÍTULO ELIMINADO CON ÉXITO',
                subtitle: `${chapter.title} [${chapter.id}]`,
                statusBadge: 'ELIMINADO',
                statusColor: '#DC3545',
                content: 'El capítulo y su historial de versiones han sido eliminados de la base de datos.',
              },
            ],
            message: `Capítulo "${chapter.title}" eliminado correctamente.`,
          };
        }

        // /chapter reorder
        if (sub === 'reorder') {
          const newOrder = parseInt((parsed.flags.order as string) || parsed.args[2] || '1', 10);
          const updated = app.chapterRepo.update(chapter.id, { chapterNumber: newOrder }, 'cli');
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'ORDEN DEL CAPÍTULO ACTUALIZADO',
                subtitle: `${chapter.title} [${chapter.id}]`,
                statusBadge: `ORDEN: ${newOrder}`,
                statusColor: '#28A745',
                fields: [
                  { label: 'Novela', value: `${story.title} [${story.id}]` },
                  { label: 'Nuevo orden', value: `Capítulo ${newOrder}` },
                ],
              },
            ],
            message: `Capítulo "${chapter.title}" reordenado a la posición ${newOrder}.`,
          };
        }

        // /chapter publish
        if (sub === 'publish') {
          const isConfirmed = Boolean(parsed.flags.confirm || parsed.flags.c);
          if (!isConfirmed) {
            return {
              success: true,
              blocks: [
                {
                  type: 'warning',
                  title: 'CONFIRMACIÓN DE PUBLICACIÓN DE CAPÍTULO',
                  subtitle: `${chapter.title} [${chapter.id}]`,
                  statusBadge: 'CONFIRMACIÓN REQUERIDA',
                  statusColor: '#FFC107',
                  content:
                    `Revisión del capítulo antes de publicar:\n\n` +
                    `1. Novela: ${story.title} [${story.id}]\n` +
                    `2. Capítulo: ${chapter.title} (${chapter.wordCount} palabras)\n` +
                    `3. Estado actual: ${chapter.status.toUpperCase()}\n\n` +
                    `Para confirmar la publicación, ejecuta:\n` +
                    `› /chapter publish ${story.id} ${chapter.id} --confirm`,
                },
              ],
              message: `Confirmación requerida: usa /chapter publish ${story.id} ${chapter.id} --confirm para proceder.`,
            };
          }

          const updated = app.chapterRepo.update(chapter.id, { status: 'published' }, 'cli');
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'CAPÍTULO CONFIRMADO COMO PUBLICADO',
                subtitle: `${chapter.title} [${chapter.id}]`,
                statusBadge: 'PUBLICADO',
                statusColor: '#28A745',
                fields: [
                  { label: 'Novela', value: `${story.title} [${story.id}]` },
                  { label: 'Estado', value: 'Publicado formalmente' },
                  { label: 'Palabras', value: `${chapter.wordCount} palabras` },
                ],
              },
            ],
            message: `Capítulo "${chapter.title}" marcado como publicado con éxito.`,
          };
        }

        // /chapter unpublish
        if (sub === 'unpublish') {
          const updated = app.chapterRepo.update(chapter.id, { status: 'draft' }, 'cli');
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'CAPÍTULO REVERTIDO A BORRADOR',
                subtitle: `${chapter.title} [${chapter.id}]`,
                statusBadge: 'BORRADOR',
                statusColor: '#808080',
                fields: [
                  { label: 'Novela', value: `${story.title} [${story.id}]` },
                  { label: 'Estado', value: 'Borrador privado (no público)' },
                ],
              },
            ],
            message: `Capítulo "${chapter.title}" revertido a borrador privado.`,
          };
        }

        return {
          success: false,
          blocks: [
            {
              type: 'error',
              title: 'Subcomando desconocido',
              content: 'Subcomandos válidos: new, open, edit, import, export, delete, reorder, publish, unpublish.',
            },
          ],
        };
      },
    },
  ];
}
