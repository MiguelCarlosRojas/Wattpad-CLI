import { CommandDefinition, CommandResult, ParsedCommand, RenderBlock } from '../../types/command.types';
import { EditorPreference, StoryStatus } from '../../types/story.types';
import { formatStatusBadge } from '../../utils/formatter';

export function createStoryCommands(): CommandDefinition[] {
  return [
    {
      name: '/stories',
      category: 'stories',
      description: 'Muestra todas tus novelas organizadas por estado en bloques informativos',
      descriptionEn: 'Shows all your stories organized by state in informative blocks',
      usage: '/stories [all | drafts | pending | published | error]',
      examples: ['/stories', '/stories drafts', '/stories published'],
      execute: (app, parsed: ParsedCommand): CommandResult => {
        const filter = parsed.subcommand || parsed.args[0];
        let stories = app.storyRepo.findAll();

        if (filter === 'drafts' || filter === 'borradores') {
          stories = stories.filter((s) => s.status === 'draft');
        } else if (filter === 'pending' || filter === 'pendientes') {
          stories = stories.filter((s) => s.status === 'pending');
        } else if (filter === 'published' || filter === 'publicadas') {
          stories = stories.filter((s) => s.status === 'published');
        } else if (filter === 'error' || filter === 'errores') {
          stories = stories.filter((s) => s.status === 'error');
        }

        if (stories.length === 0) {
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'MIS NOVELAS',
                subtitle: filter ? `Filtro aplicado: ${filter}` : 'Todas las novelas',
                statusBadge: '0 HISTORIAS',
                statusColor: '#808080',
                content: 'No se encontraron novelas con el criterio seleccionado.\nUsa /story new para crear tu primera novela.',
              },
            ],
          };
        }

        const blocks: RenderBlock[] = [
          {
            type: 'card',
            title: 'MIS HISTORIAS Y NOVELAS',
            subtitle: `Total: ${stories.length} obra(s) registrada(s)`,
            statusBadge: `${stories.length} NOVELAS`,
            statusColor: '#FF6122',
          },
        ];

        for (const story of stories) {
          const chapters = app.chapterRepo.findByStoryId(story.id);
          const badge = formatStatusBadge(story.status);
          const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

          blocks.push({
            type: 'card',
            title: `${story.title} [${story.id}]`,
            subtitle: story.description ? story.description.slice(0, 90) : 'Sin sinopsis añadida.',
            statusBadge: badge.text,
            statusColor: badge.color,
            fields: [
              { label: 'Género', value: story.genre },
              { label: 'Editor Preferido', value: story.editorPreference.toUpperCase() },
              { label: 'Capítulos', value: `${chapters.length} capítulo(s)` },
              { label: 'Palabras Totales', value: `${totalWords.toLocaleString()} palabras` },
              { label: 'Idioma', value: story.language.toUpperCase() },
              { label: 'Etiquetas', value: story.tags.length > 0 ? story.tags.join(', ') : 'Ninguna' },
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
      name: '/story',
      subcommands: ['new', 'open', 'info', 'edit', 'delete', 'import', 'export'],
      category: 'stories',
      description: 'Crea, abre, consulta detalles, edita, elimina, importa o exporta una novela',
      descriptionEn: 'Create, open, view info, edit, delete, import or export a story',
      usage: '/story [new <título> | open NOV-xxxx | info NOV-xxxx | edit NOV-xxxx | delete NOV-xxxx | import <ruta> | export NOV-xxxx]',
      examples: [
        '/story new "El Reino de Cristal" --genre=Fantasia --pref=word',
        '/story open NOV-0001',
        '/story info NOV-0001',
        '/story edit NOV-0001 --title="Nuevo Título"',
        '/story delete NOV-0001 --confirm',
        '/story import ./manuscrito.docx',
        '/story export NOV-0001',
      ],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const sub = parsed.subcommand;

        // /story new
        if (sub === 'new') {
          const title = parsed.args[0] || (parsed.flags.title as string);
          if (!title) {
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Título requerido',
                  content:
                    'Debes indicar el título de la novela.\n' +
                    'Ejemplo:\n› /story new "El Secreto del Valle" --genre=Misterio --pref=word',
                },
              ],
            };
          }

          const genre = (parsed.flags.genre as string) || (parsed.flags.g as string) || 'Fantasía';
          const pref = ((parsed.flags.pref as string) || (parsed.flags.p as string) || 'word') as EditorPreference;
          const language = (parsed.flags.lang as string) || 'es';
          const mature = Boolean(parsed.flags.mature);
          const description = (parsed.flags.desc as string) || '';

          const story = app.storyRepo.create({
            title,
            genre,
            editorPreference: pref,
            language,
            mature,
            description,
            status: 'draft',
          });

          // Set active context
          app.currentStoryId = story.id;
          app.currentChapterId = null;

          // Prepare folder and initial story document
          if (pref === 'word') {
            await app.wordService.exportStoryToDocx(story, []);
          } else if (pref === 'notepad') {
            app.notepadService.exportStoryToTxt(story, []);
          }

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: '¡NOVELA CREADA EXITOSAMENTE!',
                subtitle: `Identificador único: ${story.id}`,
                statusBadge: '[BORRADOR LOCAL]',
                statusColor: '#808080',
                fields: [
                  { label: 'Título', value: story.title },
                  { label: 'ID', value: story.id },
                  { label: 'Género', value: story.genre },
                  { label: 'Editor Preferido', value: story.editorPreference.toUpperCase() },
                  { label: 'Idioma', value: story.language.toUpperCase() },
                  { label: 'Estado', value: 'Borrador privado local (no publicado en Wattpad)' },
                ],
              },
            ],
            message: `Novela ${story.id} seleccionada como contexto activo. Usa /chapter new para añadir capítulos.`,
          };
        }

        // /story open NOV-xxxx
        if (sub === 'open') {
          const id = parsed.args[0] || app.currentStoryId;
          if (!id) {
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Identificador requerido',
                  content: 'Indica el ID de la novela. Ejemplo: /story open NOV-0001',
                },
              ],
            };
          }

          const story = app.storyRepo.findById(id);
          if (!story) {
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Novela no encontrada',
                  content: `No existe ninguna novela con el identificador "${id}". Usa /stories para ver tu catálogo.`,
                },
              ],
            };
          }

          app.currentStoryId = story.id;
          app.currentChapterId = null;
          const chapters = app.chapterRepo.findByStoryId(story.id);

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: `NOVELA ACTIVA: ${story.title} [${story.id}]`,
                subtitle: story.description || 'Sin sinopsis.',
                statusBadge: story.status.toUpperCase(),
                statusColor: '#FF6122',
                fields: [
                  { label: 'Capítulos Registrados', value: `${chapters.length} capítulo(s)` },
                  { label: 'Editor Preferido', value: story.editorPreference.toUpperCase() },
                  { label: 'Género', value: story.genre },
                ],
              },
            ],
            message: `Novela "${story.title}" establecida como contexto de trabajo.`,
          };
        }

        // /story info NOV-xxxx
        if (sub === 'info') {
          const id = parsed.args[0] || app.currentStoryId;
          if (!id) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'ID requerido', content: 'Uso: /story info NOV-0001' }],
            };
          }

          const story = app.storyRepo.findById(id);
          if (!story) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'No encontrada', content: `No existe la novela "${id}".` }],
            };
          }

          const chapters = app.chapterRepo.findByStoryId(story.id);
          const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: `FICHA TÉCNICA: ${story.title}`,
                subtitle: `Identificador: ${story.id}`,
                statusBadge: story.status.toUpperCase(),
                statusColor: '#FF6122',
                fields: [
                  { label: 'Sinopsis', value: story.description || 'Sin sinopsis disponible' },
                  { label: 'Género', value: story.genre },
                  { label: 'Categoría', value: story.category },
                  { label: 'Idioma', value: story.language.toUpperCase() },
                  { label: 'Editor Preferido', value: story.editorPreference.toUpperCase() },
                  { label: 'Contenido Adulto', value: story.mature ? 'Sí' : 'No' },
                  { label: 'Total Capítulos', value: String(chapters.length) },
                  { label: 'Total Palabras', value: `${totalWords.toLocaleString()} palabras` },
                  { label: 'ID Wattpad Cloud', value: story.wattpadId || 'No vinculado aún (Borrador local)' },
                  { label: 'Fecha Creación', value: story.createdAt.slice(0, 10) },
                ],
              },
            ],
          };
        }

        // /story edit NOV-xxxx
        if (sub === 'edit') {
          const id = parsed.args[0] || app.currentStoryId;
          if (!id) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'ID requerido', content: 'Uso: /story edit NOV-0001 --title="Nuevo Título"' }],
            };
          }

          const updates: Record<string, any> = {};
          if (parsed.flags.title) updates.title = parsed.flags.title;
          if (parsed.flags.genre) updates.genre = parsed.flags.genre;
          if (parsed.flags.desc) updates.description = parsed.flags.desc;
          if (parsed.flags.pref) updates.editorPreference = parsed.flags.pref;

          const updated = app.storyRepo.update(id, updates);
          if (!updated) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'Error', content: `No se pudo actualizar la novela "${id}".` }],
            };
          }

          return {
            success: true,
            blocks: [
              {
                type: 'success',
                title: 'Novela actualizada',
                content: `La novela "${updated.title}" [${updated.id}] se ha actualizado correctamente.`,
              },
            ],
          };
        }

        // /story delete NOV-xxxx
        if (sub === 'delete') {
          const id = parsed.args[0] || app.currentStoryId;
          if (!id) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'ID requerido', content: 'Uso: /story delete NOV-0001' }],
            };
          }

          const story = app.storyRepo.findById(id);
          if (!story) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'No encontrada', content: `No existe la novela "${id}".` }],
            };
          }

          app.storyRepo.delete(id);
          if (app.currentStoryId === id) {
            app.currentStoryId = null;
            app.currentChapterId = null;
          }

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'NOVELA ELIMINADA',
                subtitle: `${story.title} [${story.id}]`,
                statusBadge: 'ELIMINADA',
                statusColor: '#DC3545',
                content: 'La novela y sus capítulos locales han sido eliminados de la base de datos.',
              },
            ],
          };
        }

        // /story export NOV-xxxx
        if (sub === 'export') {
          const id = parsed.args[0] || app.currentStoryId;
          if (!id) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'ID requerido', content: 'Uso: /story export NOV-0001' }],
            };
          }

          const story = app.storyRepo.findById(id);
          if (!story) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'No encontrada', content: `No existe la novela "${id}".` }],
            };
          }

          const chapters = app.chapterRepo.findByStoryId(story.id);
          for (const ch of chapters) {
            if (story.editorPreference === 'word' && app.wordService) {
              await app.wordService.exportChapterToDocx(story, ch);
            } else if (story.editorPreference === 'notepad' && app.notepadService) {
              app.notepadService.exportChapterToTxt(story, ch);
            }
          }

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'NOVELA EXPORTADA EXITOSAMENTE',
                subtitle: `${story.title} [${story.id}]`,
                statusBadge: 'EXPORTADO',
                statusColor: '#28A745',
                fields: [
                  { label: 'Formato', value: story.editorPreference.toUpperCase() },
                  { label: 'Capítulos exportados', value: `${chapters.length} capítulo(s)` },
                  { label: 'Directorio', value: `Mis novelas/${story.title}/Capitulos/` },
                ],
              },
            ],
            message: `Novela "${story.title}" exportada en formato ${story.editorPreference.toUpperCase()}.`,
          };
        }

        // /story import <ruta>
        if (sub === 'import') {
          const filePath = parsed.args[0];
          if (!filePath) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'Archivo requerido', content: 'Uso: /story import ./manuscrito.docx --title="Mi Novela"' }],
            };
          }

          const title = (parsed.flags.title as string) || 'Novela Importada';
          const genre = (parsed.flags.genre as string) || 'General';
          const story = app.storyRepo.create({
            title,
            genre,
            category: 'Novela',
            language: 'es',
            editorPreference: filePath.endsWith('.txt') ? 'notepad' : 'word',
            status: 'draft',
          });

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'MANUSCRITO IMPORTADO',
                subtitle: `${story.title} [${story.id}]`,
                statusBadge: 'CREADO',
                statusColor: '#28A745',
                fields: [
                  { label: 'Archivo de origen', value: filePath },
                  { label: 'ID asignado', value: story.id },
                  { label: 'Siguiente paso', value: 'Usa /chapter new o /chapter import para estructurar los capítulos.' },
                ],
              },
            ],
            message: `Novela "${story.title}" [${story.id}] creada a partir de ${filePath}.`,
          };
        }

        return {
          success: false,
          blocks: [
            {
              type: 'error',
              title: 'Subcomando desconocido',
              content: 'Subcomandos válidos para /story: new, open, info, edit, delete, import, export.\nEjemplo: /story new "Título"',
            },
          ],
        };
      },
    },
  ];
}
