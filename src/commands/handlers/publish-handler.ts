import { CommandDefinition, CommandResult, ParsedCommand } from '../../types/command.types';

export function createPublishCommands(): CommandDefinition[] {
  return [
    {
      name: '/publish',
      subcommands: ['story', 'chapter'],
      category: 'publish',
      description: 'Prepara y publica historias y capítulos en Wattpad de forma oficial y confirmada',
      descriptionEn: 'Prepares and publishes stories and chapters to Wattpad with confirmation',
      usage: '/publish [story NOV-xxxx [--confirm] | chapter NOV-xxxx CAP-xxxx [--confirm]]',
      examples: [
        '/publish story NOV-0001',
        '/publish story NOV-0001 --confirm',
        '/publish chapter NOV-0001 CAP-0001',
        '/publish chapter NOV-0001 CAP-0001 --confirm',
      ],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const sub = parsed.subcommand;
        const isConfirmed = Boolean(parsed.flags.confirm || parsed.flags.c);

        if (sub === 'story') {
          const storyId = parsed.args[0] || app.currentStoryId;
          if (!storyId) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'ID de novela requerido', content: 'Uso: /publish story NOV-0001 [--confirm]' }],
            };
          }

          const story = app.storyRepo.findById(storyId);
          if (!story) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'No encontrada', content: `No existe la novela "${storyId}".` }],
            };
          }

          if (!isConfirmed) {
            // Require explicit confirmation
            return {
              success: true,
              blocks: [
                {
                  type: 'warning',
                  title: 'CONFIRMACIÓN DE PUBLICACIÓN EN WATTPAD',
                  subtitle: `Novela: "${story.title}" [${story.id}]`,
                  statusBadge: 'CONFIRMACIÓN REQUERIDA',
                  statusColor: '#FFC107',
                  content:
                    'Estás a punto de publicar esta novela en Wattpad Cloud.\n' +
                    'Esta acción registrará la obra de manera visible.\n\n' +
                    'Para confirmar y proceder con la publicación oficial, escribe:\n' +
                    `› /publish story ${story.id} --confirm`,
                  fields: [
                    { label: 'Título', value: story.title },
                    { label: 'Género', value: story.genre },
                    { label: 'Idioma', value: story.language.toUpperCase() },
                    { label: 'Clasificación', value: story.mature ? 'Adultos (+18)' : 'Todo público' },
                  ],
                },
              ],
            };
          }

          // Execute publishing
          try {
            const pubRes = await app.wattpadService.publishStory(story);
            app.storyRepo.update(story.id, {
              status: 'published',
              wattpadId: pubRes.wattpadId,
            });

            return {
              success: true,
              blocks: [
                {
                  type: 'card',
                  title: '¡NOVELA PUBLICADA EN WATTPAD!',
                  subtitle: `${story.title} [${story.id}]`,
                  statusBadge: '[PUBLICADO EN WATTPAD]',
                  statusColor: '#28A745',
                  content: pubRes.message,
                  fields: [
                    { label: 'ID Oficial Wattpad', value: pubRes.wattpadId },
                    { label: 'Estado', value: 'Publicada y confirmada' },
                    { label: 'Siguiente paso', value: `Usa /publish chapter ${story.id} CAP-0001 para publicar sus capítulos.` },
                  ],
                },
              ],
            };
          } catch (err: any) {
            app.storyRepo.update(story.id, { status: 'error' });
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Error al publicar novela',
                  content: `La operación no pudo completarse: ${err.message}`,
                },
              ],
            };
          }
        }

        if (sub === 'chapter') {
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
                  content: 'Uso: /publish chapter NOV-0001 CAP-0001 [--confirm]',
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

          if (!isConfirmed) {
            return {
              success: true,
              blocks: [
                {
                  type: 'warning',
                  title: 'CONFIRMACIÓN DE PUBLICACIÓN DE CAPÍTULO',
                  subtitle: `Capítulo: "${chapter.title}" [${chapter.id}]`,
                  statusBadge: 'CONFIRMACIÓN REQUERIDA',
                  statusColor: '#FFC107',
                  content:
                    'Estás a punto de publicar este capítulo en Wattpad Cloud.\n\n' +
                    'Para confirmar y proceder con la publicación oficial, escribe:\n' +
                    `› /publish chapter ${story.id} ${chapter.id} --confirm`,
                  fields: [
                    { label: 'Novela', value: `${story.title} [${story.id}]` },
                    { label: 'Capítulo', value: `Cap ${chapter.chapterNumber}: ${chapter.title}` },
                    { label: 'Palabras a publicar', value: `${chapter.wordCount} palabras` },
                  ],
                },
              ],
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
                  title: '¡CAPÍTULO PUBLICADO EN WATTPAD!',
                  subtitle: `${chapter.title} [${chapter.id}]`,
                  statusBadge: '[PUBLICADO EN WATTPAD]',
                  statusColor: '#28A745',
                  content: pubRes.message,
                  fields: [
                    { label: 'ID Oficial Capítulo', value: pubRes.wattpadId },
                    { label: 'Palabras', value: String(chapter.wordCount) },
                  ],
                },
              ],
            };
          } catch (err: any) {
            app.chapterRepo.update(chapter.id, { status: 'error' });
            return {
              success: false,
              blocks: [
                {
                  type: 'error',
                  title: 'Error al publicar capítulo',
                  content: `No se pudo publicar: ${err.message}`,
                },
              ],
            };
          }
        }

        return {
          success: false,
          blocks: [
            {
              type: 'error',
              title: 'Subcomando inválido',
              content: 'Subcomandos válidos: story, chapter.\nEjemplo: /publish story NOV-0001',
            },
          ],
        };
      },
    },
  ];
}
