import { CommandDefinition, CommandResult, ParsedCommand, RenderBlock } from '../../../core/types/command.types';
import { EditorPreference } from '../types/story.types';
import { formatStatusBadge } from '../../../core/utils/formatter';

export function createStoryCommands(): CommandDefinition[] {
  return [
    {
      name: '/stories',
      subcommands: ['search', 'drafts', 'published'],
      category: 'stories',
      description: 'Muestra todas las novelas de tu cuenta o busca entre tus obras',
      descriptionEn: 'Shows all stories in your account or searches your works',
      usage: '/stories [search <término> | drafts | published]',
      examples: ['/stories', '/stories search "fantasía"', '/stories drafts', '/stories published'],
      execute: (app, parsed: ParsedCommand): CommandResult => {
        let stories = app.storyRepo.findAll();

        // Manejo de /stories search <query>
        if (parsed.subcommand === 'search' || parsed.args[0] === 'search') {
          const query = (parsed.subcommand === 'search' ? parsed.args.join(' ') : parsed.args.slice(1).join(' ')).trim().toLowerCase();
          if (!query) {
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Término de búsqueda requerido',
                  content: 'Uso: /stories search "término"',
                },
              ],
            };
          }

          const matched = stories.filter(
            (s: any) =>
              s.title.toLowerCase().includes(query) ||
              s.genre.toLowerCase().includes(query) ||
              (s.description && s.description.toLowerCase().includes(query)) ||
              (s.tags && s.tags.some((t: string) => t.toLowerCase().includes(query)))
          );

          if (matched.length === 0) {
            return {
              success: true,
              blocks: [
                {
                  type: 'card',
                  title: `BÚSQUEDA DE NOVELAS: "${query}"`,
                  subtitle: 'Catálogo de obras',
                  statusBadge: '0 COINCIDENCIAS',
                  statusColor: '#808080',
                  content: `No se encontraron novelas en tu cuenta que coincidan con "${query}".`,
                },
              ],
              message: `No se encontraron novelas que coincidan con "${query}".`,
            };
          }

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: `RESULTADOS DE BÚSQUEDA: "${query}"`,
                subtitle: `${matched.length} obra(s) encontrada(s) en tu catálogo`,
                statusBadge: `${matched.length} COINCIDENCIAS`,
                statusColor: '#17A2B8',
                items: matched.map((s: any) => ({
                  primary: `${s.title} [${s.id}]`,
                  secondary: `Género: ${s.genre} | Idioma: ${s.language.toUpperCase()} | Estado: ${s.status}`,
                  badge: s.wattpadId ? 'EN WATTPAD' : 'BORRADOR',
                })),
              },
            ],
          };
        }

        const filter = parsed.subcommand || parsed.args[0];

        if (filter === 'drafts' || filter === 'borradores') {
          stories = stories.filter((s: any) => s.status === 'draft');
        } else if (filter === 'published' || filter === 'publicadas') {
          stories = stories.filter((s: any) => s.status === 'published');
        }

        if (stories.length === 0) {
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'MIS NOVELAS',
                subtitle: filter ? `Filtro: ${filter}` : 'Catálogo de obras',
                statusBadge: '0 NOVELAS',
                statusColor: '#808080',
                content: 'No tienes novelas disponibles en esta cuenta.\nUsa /story create "Título" para crear tu primera novela.',
              },
            ],
            message: 'No tienes novelas disponibles en esta cuenta.',
          };
        }

        const blocks: RenderBlock[] = [
          {
            type: 'card',
            title: 'MIS NOVELAS Y OBRAS',
            subtitle: `Total: ${stories.length} obra(s) en tu cuenta`,
            statusBadge: `${stories.length} NOVELAS`,
            statusColor: '#FF6122',
          },
        ];

        for (const story of stories) {
          const chapters = app.chapterRepo.findByStoryId(story.id);
          const badge = formatStatusBadge(story.status);
          const totalWords = chapters.reduce((sum: number, ch: any) => sum + ch.wordCount, 0);

          blocks.push({
            type: 'card',
            title: `${story.title} [${story.id}]`,
            subtitle: story.description ? story.description.slice(0, 90) : 'Sin sinopsis.',
            statusBadge: badge.text,
            statusColor: badge.color,
            fields: [
              { label: 'Género', value: story.genre },
              { label: 'Editor Preferido', value: story.editorPreference.toUpperCase() },
              { label: 'Capítulos', value: `${chapters.length} capítulo(s)` },
              { label: 'Palabras Totales', value: `${totalWords.toLocaleString()} palabras` },
              { label: 'Privacidad', value: story.status === 'published' ? 'Pública en Wattpad' : 'Privada / Borrador' },
              { label: 'Identificador Wattpad', value: story.wattpadId || 'Pendiente de publicación' },
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
      subcommands: ['create', 'new', 'open', 'info', 'edit', 'delete', 'privacy'],
      category: 'stories',
      description: 'Crea, selecciona, consulta detalles, edita, elimina o gestiona la privacidad de una novela',
      descriptionEn: 'Create, select, view info, edit, delete or manage privacy of a story',
      usage: '/story [create <título> | open NOV-xxxx | info NOV-xxxx | edit NOV-xxxx | delete NOV-xxxx | privacy NOV-xxxx]',
      examples: [
        '/story create "El Secreto del Valle" --genre=Fantasía',
        '/story open NOV-0001',
        '/story info NOV-0001',
        '/story edit NOV-0001 --title="Nuevo Título" --desc="Nueva sinopsis"',
        '/story delete NOV-0001 --confirm',
        '/story privacy NOV-0001 public',
      ],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        let sub = parsed.subcommand;
        let targetId = parsed.args[0];

        // Si el usuario escribe `/story NOV-0001`, tratarlo como `/story open NOV-0001`
        if (sub && sub.startsWith('NOV-')) {
          targetId = sub;
          sub = 'open';
        }

        // Si no hay subcomando pero hay novela activa, mostrar /story info
        if (!sub && app.currentStoryId) {
          sub = 'info';
          targetId = app.currentStoryId;
        } else if (!sub) {
          return {
            success: false,
            blocks: [
              {
                type: 'card',
                title: 'GESTIÓN DE NOVELAS',
                subtitle: 'Comandos disponibles',
                statusBadge: 'AYUDA',
                statusColor: '#FF6122',
                content:
                  'Comandos disponibles para gestionar novelas:\n' +
                  '› /story create <título>       Crea una nueva novela\n' +
                  '› /story open NOV-xxxx         Selecciona y abre una novela\n' +
                  '› /story info NOV-xxxx         Consulta la información detallada\n' +
                  '› /story edit NOV-xxxx         Modifica título, género, sinopsis o etiquetas\n' +
                  '› /story delete NOV-xxxx       Elimina una novela con confirmación\n' +
                  '› /story privacy NOV-xxxx      Modifica la privacidad (public / private)\n' +
                  '› /stories                     Lista todas tus novelas',
              },
            ],
          };
        }

        // /story create o /story new
        if (sub === 'create' || sub === 'new') {
          const title = (parsed.flags.title as string) || parsed.args.join(' ');
          if (!title) {
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Título requerido',
                  content: 'Debes indicar el título de la novela.\nEjemplo: /story create "El Reino Olvidado" --genre=Fantasía',
                },
              ],
            };
          }

          const genre = (parsed.flags.genre as string) || (parsed.flags.g as string) || 'General';
          const pref = ((parsed.flags.pref as string) || (parsed.flags.p as string) || 'word') as EditorPreference;
          const language = (parsed.flags.lang as string) || 'es';
          const mature = Boolean(parsed.flags.mature);
          const description = (parsed.flags.desc as string) || (parsed.flags.description as string) || '';
          const tags = parsed.flags.tags ? String(parsed.flags.tags).split(',').map((t) => t.trim()) : [];

          const story = app.storyRepo.create({
            title,
            genre,
            editorPreference: pref,
            language,
            mature,
            description,
            tags,
            status: 'draft',
          });

          app.currentStoryId = story.id;
          app.currentChapterId = null;

          // Preparar documentos iniciales
          if (pref === 'word') {
            await app.wordService.exportStoryToDocx(story, []).catch(() => {});
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
                  { label: 'Identificador', value: story.id },
                  { label: 'Género', value: story.genre },
                  { label: 'Privacidad', value: 'Borrador privado (no publicado)' },
                  { label: 'Editor Preferido', value: story.editorPreference.toUpperCase() },
                  { label: 'Siguiente paso', value: 'Usa /chapter create "Capítulo 1" o /chapter import <archivo>' },
                ],
              },
            ],
            message: `Novela ${story.id} creada y seleccionada como contexto activo.`,
          };
        }

        // /story open NOV-xxxx
        if (sub === 'open') {
          const id = targetId || app.currentStoryId;
          if (!id) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'Identificador requerido', content: 'Uso: /story open NOV-0001' }],
            };
          }

          const story = app.storyRepo.findById(id);
          if (!story) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'Novela no encontrada', content: `No existe la novela con identificador "${id}".` }],
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
                subtitle: `ID: ${story.id}`,
                statusBadge: formatStatusBadge(story.status).text,
                statusColor: formatStatusBadge(story.status).color,
                fields: [
                  { label: 'Título', value: story.title },
                  { label: 'Género', value: story.genre },
                  { label: 'Capítulos', value: `${chapters.length} capítulo(s)` },
                  { label: 'Privacidad', value: story.status === 'published' ? 'Pública' : 'Borrador Privado' },
                  { label: 'Sinopsis', value: story.description || 'Sin sinopsis.' },
                ],
              },
            ],
            message: `Novela "${story.title}" (${story.id}) seleccionada como contexto activo.`,
          };
        }

        // /story info NOV-xxxx
        if (sub === 'info') {
          const id = targetId || app.currentStoryId;
          if (!id) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'Identificador requerido', content: 'Uso: /story info NOV-0001' }],
            };
          }

          const story = app.storyRepo.findById(id);
          if (!story) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'Novela no encontrada', content: `No existe la novela "${id}".` }],
            };
          }

          const chapters = app.chapterRepo.findByStoryId(story.id);
          const totalWords = chapters.reduce((sum: number, c: any) => sum + c.wordCount, 0);

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: `INFORMACIÓN DE LA NOVELA: ${story.title}`,
                subtitle: `ID: ${story.id}`,
                statusBadge: story.status === 'published' ? 'PUBLICADA' : 'BORRADOR',
                statusColor: story.status === 'published' ? '#28A745' : '#808080',
                fields: [
                  { label: 'Título', value: story.title },
                  { label: 'Género', value: story.genre },
                  { label: 'Idioma', value: story.language.toUpperCase() },
                  { label: 'Clasificación', value: story.mature ? 'Adultos (+18)' : 'Todo público' },
                  { label: 'Capítulos', value: `${chapters.length} capítulo(s)` },
                  { label: 'Palabras totales', value: `${totalWords.toLocaleString()} palabras` },
                  { label: 'ID Wattpad', value: story.wattpadId || 'No vinculada' },
                  { label: 'Sinopsis', value: story.description || 'Sin sinopsis disponible.' },
                  { label: 'Etiquetas', value: story.tags && story.tags.length > 0 ? story.tags.join(', ') : 'Ninguna' },
                ],
              },
            ],
          };
        }

        // /story edit NOV-xxxx
        if (sub === 'edit') {
          const id = targetId || app.currentStoryId;
          if (!id) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'Identificador requerido', content: 'Uso: /story edit NOV-0001 --title="..." --desc="..."' }],
            };
          }

          const story = app.storyRepo.findById(id);
          if (!story) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'Novela no encontrada', content: `No existe la novela "${id}".` }],
            };
          }

          const updates: any = {};
          if (parsed.flags.title) updates.title = String(parsed.flags.title);
          if (parsed.flags.desc || parsed.flags.description) updates.description = String(parsed.flags.desc || parsed.flags.description);
          if (parsed.flags.genre || parsed.flags.g) updates.genre = String(parsed.flags.genre || parsed.flags.g);
          if (parsed.flags.tags) updates.tags = String(parsed.flags.tags).split(',').map((t) => t.trim());
          if (parsed.flags.mature !== undefined) updates.mature = Boolean(parsed.flags.mature);
          if (parsed.flags.pref) updates.editorPreference = parsed.flags.pref;

          if (Object.keys(updates).length === 0) {
            return {
              success: false,
              blocks: [
                {
                  type: 'warning',
                  title: 'Sin cambios especificados',
                  content: 'Indica los campos que deseas modificar:\n--title="..." --desc="..." --genre="..." --tags="fantasía,aventura"',
                },
              ],
            };
          }

          const updated = app.storyRepo.update(id, updates);

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'NOVELA ACTUALIZADA',
                subtitle: `${updated.title} [${updated.id}]`,
                statusBadge: 'METADATOS ACTUALIZADOS',
                statusColor: '#28A745',
                fields: [
                  { label: 'Título', value: updated.title },
                  { label: 'Género', value: updated.genre },
                  { label: 'Sinopsis', value: updated.description || 'Sin sinopsis.' },
                  { label: 'Etiquetas', value: updated.tags?.length > 0 ? updated.tags.join(', ') : 'Ninguna' },
                ],
              },
            ],
            message: `Novela ${id} actualizada correctamente.`,
          };
        }

        // /story delete NOV-xxxx --confirm
        if (sub === 'delete') {
          const id = targetId || app.currentStoryId;
          const isConfirmed = Boolean(parsed.flags.confirm || parsed.flags.c);

          if (!id) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'Identificador requerido', content: 'Uso: /story delete NOV-0001 --confirm' }],
            };
          }

          const story = app.storyRepo.findById(id);
          if (!story) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'Novela no encontrada', content: `No existe la novela "${id}".` }],
            };
          }

          if (!isConfirmed) {
            return {
              success: false,
              blocks: [
                {
                  type: 'warning',
                  title: 'CONFIRMACIÓN OBLIGATORIA REQUERIDA',
                  subtitle: `Eliminar novela: "${story.title}" [${story.id}]`,
                  statusBadge: 'ACCIÓN IRREVERSIBLE',
                  statusColor: '#DC3545',
                  content:
                    `Estás a punto de eliminar la novela "${story.title}".\n` +
                    'Esta acción eliminará todos los capítulos asociados en la base de datos local.\n\n' +
                    'Para confirmar ejecuta:\n' +
                    `› /story delete ${story.id} --confirm`,
                },
              ],
              message: `Confirmación requerida. Ejecuta /story delete ${story.id} --confirm para borrar.`,
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
                subtitle: `"${story.title}" [${story.id}]`,
                statusBadge: 'ELIMINADA',
                statusColor: '#808080',
                content: `La novela "${story.title}" y sus capítulos locales han sido eliminados.`,
              },
            ],
            message: `Novela ${story.id} eliminada exitosamente.`,
          };
        }

        // /story privacy NOV-xxxx [public|private]
        if (sub === 'privacy') {
          const id = targetId || app.currentStoryId;
          const setting = parsed.args[1] || parsed.flags.set;

          if (!id) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'Identificador requerido', content: 'Uso: /story privacy NOV-0001 [public|private]' }],
            };
          }

          const story = app.storyRepo.findById(id);
          if (!story) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'Novela no encontrada', content: `No existe la novela "${id}".` }],
            };
          }

          if (setting === 'public' || setting === 'pública' || setting === 'publica') {
            app.storyRepo.update(id, { status: 'published' });
            return {
              success: true,
              blocks: [
                {
                  type: 'card',
                  title: 'PRIVACIDAD DE NOVELA ACTUALIZADA',
                  subtitle: `${story.title} [${story.id}]`,
                  statusBadge: 'PÚBLICA',
                  statusColor: '#28A745',
                  content: `La novela "${story.title}" ha sido configurada como pública en Wattpad.`,
                },
              ],
            };
          } else if (setting === 'private' || setting === 'privada') {
            app.storyRepo.update(id, { status: 'draft' });
            return {
              success: true,
              blocks: [
                {
                  type: 'card',
                  title: 'PRIVACIDAD DE NOVELA ACTUALIZADA',
                  subtitle: `${story.title} [${story.id}]`,
                  statusBadge: 'PRIVADA',
                  statusColor: '#808080',
                  content: `La novela "${story.title}" ha sido configurada como borrador privado.`,
                },
              ],
            };
          }

          // Consultar estado de privacidad
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: `PRIVACIDAD: ${story.title}`,
                subtitle: `ID: ${story.id}`,
                statusBadge: story.status === 'published' ? 'PÚBLICA' : 'PRIVADA (BORRADOR)',
                statusColor: story.status === 'published' ? '#28A745' : '#808080',
                fields: [
                  { label: 'Estado actual', value: story.status === 'published' ? 'Pública en Wattpad' : 'Borrador privado' },
                  { label: 'Para cambiar', value: `/story privacy ${story.id} public  o  /story privacy ${story.id} private` },
                ],
              },
            ],
          };
        }

        return {
          success: false,
          blocks: [{ type: 'error', title: 'Subcomando no reconocido', content: `Uso: /story [create | open | info | edit | delete | privacy]` }],
        };
      },
    },
  ];
}
