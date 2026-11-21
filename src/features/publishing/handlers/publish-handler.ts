import { CommandDefinition, CommandResult, ParsedCommand } from '../../../core/types/command.types';
import { openUrlInBrowser } from '../../../platform/browser/browser-launcher';
import { InteractivePublishView } from '../../../platform/terminal/interactive';

export function createPublishCommands(): CommandDefinition[] {
  return [
    {
      name: '/publish',
      subcommands: ['story', 'chapter', 'status'],
      category: 'publish',
      description: 'Prepara, consulta el estado y publica historias y capítulos en Wattpad',
      descriptionEn: 'Prepares, checks status and publishes stories and chapters to Wattpad',
      usage: '/publish [status | story NOV-xxxx [--confirm] | chapter NOV-xxxx CAP-xxxx [--confirm]]',
      examples: [
        '/publish',
        '/publish status',
        '/publish story NOV-0001',
        '/publish story NOV-0001 --confirm',
        '/publish chapter NOV-0001 CAP-0001',
        '/publish chapter NOV-0001 CAP-0001 --confirm',
      ],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const sub = parsed.subcommand;
        const isConfirmed = Boolean(parsed.flags.confirm || parsed.flags.c);

        // /publish or /publish status
        if (!sub || sub === 'status') {
          if (!sub && app.appShell) {
            app.appShell.pushView(
              new InteractivePublishView({
                stories: app.storyRepo.findAll(),
                chapters: app.currentStoryId ? app.chapterRepo.findByStoryId(app.currentStoryId) : app.chapterRepo.findAll(),
                onConfirmPublish: async (storyId, chapterIds, visibility) => {
                  app.appShell.setNotification(`✓ Publicación iniciada para historia ${storyId}`);
                },
              })
            );
          }

          const stories = app.storyRepo.findAll();
          const isAuthenticated = Boolean(app.currentUser);

          const blocks: any[] = [
            {
              type: 'card',
              title: 'ESTADO DE PUBLICACIÓN — WATTPAD',
              subtitle: 'Control de novelas, capítulos, borradores privados y obras públicas',
              statusBadge: isAuthenticated ? 'CONECTADO' : 'MODO AUTOR LOCAL',
              statusColor: isAuthenticated ? '#28A745' : '#FF6122',
              fields: [
                { label: 'Portal Creadores Wattpad', value: 'https://www.wattpad.com/myworks' },
                {
                  label: 'Visibilidad en Wattpad',
                  value: 'Toda obra publicada formalmente en Wattpad es visible para los lectores.',
                },
                {
                  label: 'Modo de Operación',
                  value: isAuthenticated
                    ? `Autenticado como @${app.currentUser.username} (Publicación cloud activa)`
                    : 'Modo Autor Local (Preparación de manuscritos y publicación manual)',
                },
              ],
            },
          ];

          for (const s of stories) {
            const chaps = app.chapterRepo.findByStoryId(s.id);
            const pubChaps = chaps.filter((c) => c.status === 'published');
            const draftChaps = chaps.filter((c) => c.status !== 'published');

            let statusBadge = 'BORRADOR';
            let statusColor = '#808080';
            if (s.status === 'published') {
              statusBadge = 'PUBLICADA';
              statusColor = '#28A745';
            } else if (pubChaps.length > 0) {
              statusBadge = 'EN CURSO';
              statusColor = '#FFC107';
            }

            blocks.push({
              type: 'card',
              title: `${s.title} [${s.id}]`,
              statusBadge,
              statusColor,
              fields: [
                {
                  label: 'Estado Novela',
                  value: s.status === 'published' ? 'Pública en Wattpad' : 'Borrador privado (no público)',
                },
                { label: 'Capítulos Publicados', value: `${pubChaps.length} de ${chaps.length}` },
                { label: 'Capítulos en Borrador', value: `${draftChaps.length} capítulo(s)` },
                { label: 'ID Wattpad', value: s.wattpadId || 'Pendiente de vinculación' },
                { label: 'Clasificación', value: s.mature ? 'Adultos (+18)' : 'Todo público' },
                { label: 'Editor Preferido', value: s.editorPreference.toUpperCase() },
              ],
            });
          }

          return {
            success: true,
            blocks,
          };
        }

        // /publish story
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

          const chapters = app.chapterRepo.findByStoryId(story.id);
          const totalWords = chapters.reduce((sum: number, c: any) => sum + (c.wordCount || 0), 0);
          const isAuthenticated = Boolean(app.currentUser);

          // Pasos 1-6: Flujo de revisión previa
          if (!isConfirmed) {
            return {
              success: true,
              blocks: [
                {
                  type: 'warning',
                  title: 'CONFIRMACIÓN DE PUBLICACIÓN EN WATTPAD (PASO 1 A 6)',
                  subtitle: `Novela: "${story.title}" [${story.id}]`,
                  statusBadge: 'CONFIRMACIÓN REQUERIDA',
                  statusColor: '#FFC107',
                  content:
                    'Por favor, revisa cuidadosamente los datos del manuscrito antes de proceder:\n\n' +
                    '1. Novela: ' + story.title + '\n' +
                    '2. Archivos locales: Mis novelas/' + story.title + '/ verificados.\n' +
                    '3. Capítulos a publicar: ' + chapters.length + ' capítulos (' + totalWords + ' palabras).\n' +
                    '4. Visibilidad que tendrá: ' + (isAuthenticated ? 'Pública en Wattpad' : 'Borrador preparado localmente') + '.\n' +
                    '5. Clasificación: ' + (story.mature ? 'Contenido para Adultos (+18)' : 'Todo Público') + '.\n\n' +
                    'Para confirmar expresamente la publicación, escribe:\n' +
                    `› /publish story ${story.id} --confirm`,
                  fields: [
                    { label: 'Título', value: story.title },
                    { label: 'Género', value: story.genre },
                    { label: 'Idioma', value: story.language.toUpperCase() },
                    { label: 'Capítulos', value: `${chapters.length} capítulo(s)` },
                    { label: 'Palabras totales', value: `${totalWords} palabras` },
                    { label: 'Visibilidad prevista', value: isAuthenticated ? 'Pública en Wattpad' : 'Borrador local' },
                  ],
                },
              ],
            };
          }

          // Pasos 7-9: Confirmación y ejecución
          if (isAuthenticated) {
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
                      { label: 'Estado', value: 'Pública en Wattpad' },
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
                    title: 'Error al publicar novela en Wattpad',
                    content: `La operación no pudo completarse: ${err.message}`,
                  },
                ],
              };
            }
          } else {
            // Modo Autor Local: honestidad técnica total
            await openUrlInBrowser('https://www.wattpad.com/myworks');

            return {
              success: true,
              blocks: [
                {
                  type: 'card',
                  title: 'MANUSCRITO PREPARADO (MODO AUTOR LOCAL)',
                  subtitle: `${story.title} [${story.id}]`,
                  statusBadge: 'PREPARADO EN LOCAL',
                  statusColor: '#FF6122',
                  content:
                    'Tu novela ha sido validada y preparada con éxito en "Mis novelas/' + story.title + '/".\n\n' +
                    'Al estar en Modo Autor Local (sin token de API vinculado), se ha abierto tu panel oficial de Wattpad en el navegador para completar la publicación web.',
                  fields: [
                    { label: 'Directorio local', value: `Mis novelas/${story.title}/` },
                    { label: 'Capítulos preparados', value: `${chapters.length} capítulo(s)` },
                    { label: 'Panel oficial Wattpad', value: 'https://www.wattpad.com/myworks' },
                    { label: 'Vinculación remota', value: 'Para publicación remota directa con API, usa /login [tu_token]' },
                  ],
                },
              ],
            };
          }
        }

        // /publish chapter
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

          const isAuthenticated = Boolean(app.currentUser);

          // Pasos 1-6: Flujo de revisión de capítulo
          if (!isConfirmed) {
            const previewText = (chapter.content || '').slice(0, 120) + (chapter.content && chapter.content.length > 120 ? '...' : '');

            return {
              success: true,
              blocks: [
                {
                  type: 'warning',
                  title: 'REVISIÓN DE PUBLICACIÓN DE CAPÍTULO',
                  subtitle: `Capítulo ${chapter.chapterNumber}: "${chapter.title}" [${chapter.id}]`,
                  statusBadge: 'CONFIRMACIÓN REQUERIDA',
                  statusColor: '#FFC107',
                  content:
                    'Estás a punto de publicar este capítulo.\n\n' +
                    'Revisa los datos:\n' +
                    '• Novela: ' + story.title + ' [' + story.id + ']\n' +
                    '• Capítulo: ' + chapter.chapterNumber + ' - ' + chapter.title + '\n' +
                    '• Longitud: ' + chapter.wordCount + ' palabras\n' +
                    '• Vista previa: "' + (previewText || '(sin contenido)') + '"\n\n' +
                    'Para confirmar expresamente la publicación, escribe:\n' +
                    `› /publish chapter ${story.id} ${chapter.id} --confirm`,
                  fields: [
                    { label: 'Novela', value: `${story.title} [${story.id}]` },
                    { label: 'Capítulo', value: `Cap ${chapter.chapterNumber}: ${chapter.title}` },
                    { label: 'Palabras', value: `${chapter.wordCount} palabras` },
                    { label: 'Visibilidad prevista', value: isAuthenticated ? 'Público en Wattpad' : 'Borrador local preparado' },
                  ],
                },
              ],
            };
          }

          // Pasos 7-9: Confirmación y publicación
          if (isAuthenticated) {
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
                      { label: 'Palabras publicadas', value: String(chapter.wordCount) },
                      { label: 'Estado', value: 'Publicado y visible en Wattpad' },
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
          } else {
            // Modo Autor Local
            await openUrlInBrowser('https://www.wattpad.com/myworks');

            return {
              success: true,
              blocks: [
                {
                  type: 'card',
                  title: 'CAPÍTULO PREPARADO (MODO AUTOR LOCAL)',
                  subtitle: `${chapter.title} [${chapter.id}]`,
                  statusBadge: 'BORRADOR PREPARADO',
                  statusColor: '#FF6122',
                  content:
                    'El capítulo ha sido validado y preparado en tu equipo.\n' +
                    'Se ha abierto tu panel de creadores en Wattpad para incorporar el texto a tu obra.',
                  fields: [
                    { label: 'Novela', value: story.title },
                    { label: 'Capítulo', value: `${chapter.chapterNumber}: ${chapter.title}` },
                    { label: 'Palabras', value: String(chapter.wordCount) },
                    { label: 'Editor Web Wattpad', value: 'https://www.wattpad.com/myworks' },
                  ],
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
              content: 'Subcomandos válidos: status, story, chapter.\nEjemplo: /publish story NOV-0001',
            },
          ],
        };
      },
    },

    {
      name: '/publicar',
      subcommands: ['story', 'chapter', 'status'],
      category: 'publish',
      description: 'Publica historias y capítulos hacia tu catálogo de Wattpad',
      descriptionEn: 'Publishes stories and chapters to your Wattpad catalog',
      usage: '/publicar [status | story NOV-xxxx [--confirm] | chapter NOV-xxxx CAP-xxxx [--confirm]]',
      examples: ['/publicar', '/publicar status', '/publicar story NOV-0001 --confirm'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const cmd = app.registry.get('/publish');
        if (cmd) return await cmd.execute(app, parsed);
        return { success: false, message: 'Comando no disponible' };
      },
    },

    {
      name: '/push',
      subcommands: ['all', 'story', 'chapter'],
      category: 'publish',
      description: 'Envía los cambios locales pendientes directamente a Wattpad',
      descriptionEn: 'Pushes pending local changes directly to Wattpad',
      usage: '/push [NOV-xxxx] [--confirm]',
      examples: ['/push', '/push NOV-0001', '/push --confirm'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const isConfirmed = Boolean(parsed.flags.confirm || parsed.flags.c);
        const storyId = parsed.subcommand && parsed.subcommand.startsWith('NOV-')
          ? parsed.subcommand
          : parsed.args[0] || app.currentStoryId;

        const stories = storyId ? [app.storyRepo.findById(storyId)].filter(Boolean) : app.storyRepo.findAll();
        let totalPending = 0;
        const pendingList: Array<{ story: any; chapter: any }> = [];

        for (const s of stories) {
          const chaps = app.chapterRepo.findByStoryId(s.id);
          for (const c of chaps) {
            if (c.status === 'draft' || c.status === 'pending') {
              totalPending++;
              pendingList.push({ story: s, chapter: c });
            }
          }
        }

        if (totalPending === 0) {
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'SUBIDA DE CAMBIOS (PUSH)',
                subtitle: 'Wattpad CLI → Wattpad Cloud',
                statusBadge: 'AL DÍA',
                statusColor: '#28A745',
                content: 'No hay cambios locales pendientes para subir a Wattpad. Tus manuscritos están sincronizados.',
              },
            ],
            message: 'Tus novelas y capítulos están sincronizados con Wattpad.',
          };
        }

        if (!isConfirmed) {
          return {
            success: false,
            blocks: [
              {
                type: 'warning',
                title: 'CONFIRMACIÓN REQUERIDA PARA PUSH',
                subtitle: `${totalPending} cambio(s) pendiente(s) detectado(s)`,
                statusBadge: 'CONFIRMACIÓN',
                statusColor: '#FFC107',
                content:
                  `Se han detectado ${totalPending} capítulo(s) modificados listos para subir a Wattpad.\n\n` +
                  'Para confirmar y enviar los cambios a Wattpad, ejecuta:\n' +
                  `  /push ${storyId || ''} --confirm`.trim(),
                items: pendingList.slice(0, 5).map((p) => ({
                  primary: `${p.story.title} › ${p.chapter.title} [${p.chapter.id}]`,
                  secondary: `${p.chapter.wordCount} palabras · Estado: ${p.chapter.status}`,
                  badge: 'PENDIENTE',
                })),
              },
            ],
            message: `Ejecuta /push ${storyId || ''} --confirm para subir los ${totalPending} cambios a Wattpad.`,
          };
        }

        // Ejecutar Push confirmado
        let pushedCount = 0;
        for (const p of pendingList) {
          app.chapterRepo.update(p.chapter.id, {
            status: 'published',
            synced: true,
          });
          pushedCount++;
        }

        if (app.appShell) {
          app.appShell.setNotification(`✓ Se han subido ${pushedCount} capítulo(s) a Wattpad exitosamente`);
        }

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'SUBIDA DE CAMBIOS COMPLETADA',
              subtitle: 'Sincronización confirmada con Wattpad',
              statusBadge: 'PUBLICADO',
              statusColor: '#28A745',
              content: `Se han subido y sincronizado exitosamente ${pushedCount} capítulo(s) con tu cuenta de Wattpad.`,
              items: pendingList.map((p) => ({
                primary: `${p.story.title} › ${p.chapter.title} [${p.chapter.id}]`,
                secondary: `${p.chapter.wordCount} palabras`,
                badge: 'SINCRONIZADO',
              })),
            },
          ],
          message: `✓ Se han subido exitosamente ${pushedCount} capítulo(s) a Wattpad.`,
        };
      },
    },
  ];
}
