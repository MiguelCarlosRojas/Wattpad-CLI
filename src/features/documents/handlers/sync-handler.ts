import { CommandDefinition, CommandResult, ParsedCommand, RenderBlock } from '../../../core/types/command.types';

export function createSyncCommands(): CommandDefinition[] {
  return [
    {
      name: '/sync',
      subcommands: ['status', 'story', 'chapter', 'history'],
      category: 'sync',
      description: 'Sincroniza novelas y capítulos con Word, Bloc de Notas o Google Docs',
      descriptionEn: 'Syncs stories and chapters with Word, Notepad or Google Docs',
      usage: '/sync [status | story NOV-xxxx | chapter NOV-xxxx CAP-xxxx | history]',
      examples: [
        '/sync',
        '/sync status',
        '/sync story NOV-0001',
        '/sync chapter NOV-0001 CAP-0001',
        '/sync history',
      ],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const sub = parsed.subcommand;

        // /sync history
        if (sub === 'history') {
          const records = app.syncRepo.getHistory(15);
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'HISTORIAL DE SINCRONIZACIÓN',
                subtitle: 'Últimas operaciones registradas',
                statusBadge: `${records.length} REGISTROS`,
                statusColor: '#17A2B8',
                items: records.length > 0
                  ? records.map((r) => ({
                      primary: `[${r.entityType.toUpperCase()} ${r.entityId}] Acción: ${r.action}`,
                      secondary: `${r.details} | ${r.createdAt.slice(0, 19).replace('T', ' ')}`,
                      badge: r.status.toUpperCase(),
                    }))
                  : [{ primary: 'No hay operaciones de sincronización registradas.' }],
              },
            ],
          };
        }

        // /sync chapter NOV-xxxx CAP-xxxx
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
                  content: 'Indica la novela y el capítulo: /sync chapter NOV-0001 CAP-0001',
                },
              ],
            };
          }

          const res = await app.syncEngine.syncChapter(storyId, chapterId);
          const blocks: RenderBlock[] = [
            {
              type: res.status === 'conflict' ? 'warning' : 'card',
              title: `SINCRONIZACIÓN DE CAPÍTULO [${res.entityId}]`,
              subtitle: `${res.source} → ${res.destination}`,
              statusBadge: res.status.toUpperCase(),
              statusColor: res.status === 'synced' ? '#28A745' : '#FFC107',
              content: res.message,
            },
          ];

          if (res.diff && res.diff.hasDifferences) {
            blocks.push({
              type: 'diff',
              title: 'VISTA PREVIA DE DIFERENCIAS',
              subtitle: res.diff.summary,
              fields: [
                { label: 'Líneas Locales', value: String(res.diff.localLinesCount) },
                { label: 'Líneas Externas', value: String(res.diff.externalLinesCount) },
                { label: 'Líneas Añadidas', value: `+${res.diff.addedLines}` },
                { label: 'Líneas Eliminadas', value: `-${res.diff.removedLines}` },
              ],
            });
          }

          return {
            success: res.success,
            blocks,
          };
        }

        // /sync story NOV-xxxx
        if (sub === 'story') {
          const storyId = parsed.args[0] || app.currentStoryId;
          if (!storyId) {
            return {
              success: false,
              blocks: [{ type: 'error', title: 'ID de novela requerido', content: 'Uso: /sync story NOV-0001' }],
            };
          }

          const results = await app.syncEngine.syncStory(storyId);
          const blocks: RenderBlock[] = [
            {
              type: 'card',
              title: `SINCRONIZACIÓN COMPLETA DE NOVELA [${storyId}]`,
              subtitle: `Total capítulos procesados: ${results.length}`,
              statusBadge: 'COMPLETO',
              statusColor: '#28A745',
              items: results.map((r) => ({
                primary: `Capítulo [${r.entityId}]: ${r.source} → ${r.destination}`,
                secondary: r.message,
                badge: r.status.toUpperCase(),
              })),
            },
          ];

          return {
            success: true,
            blocks,
          };
        }

        // /sync status or default /sync
        const stories = app.storyRepo.findAll();
        const blocks: RenderBlock[] = [
          {
            type: 'card',
            title: 'PANEL GENERAL DE SINCRONIZACIÓN',
            subtitle: 'Estado de coherencia entre Wattpad CLI y tus archivos locales',
            statusBadge: 'MONITOR',
            statusColor: '#FF6122',
          },
        ];

        for (const story of stories) {
          const chapters = app.chapterRepo.findByStoryId(story.id);
          const pendingCount = chapters.filter((c) => c.status === 'draft' || c.status === 'pending').length;

          blocks.push({
            type: 'card',
            title: `${story.title} [${story.id}]`,
            subtitle: `Editor: ${story.editorPreference.toUpperCase()}`,
            statusBadge: pendingCount > 0 ? `${pendingCount} PENDIENTES` : 'AL DÍA',
            statusColor: pendingCount > 0 ? '#FFC107' : '#28A745',
            fields: [
              { label: 'Total Capítulos', value: String(chapters.length) },
              { label: 'Estado Novela', value: story.status.toUpperCase() },
              { label: 'Comando de Sincronización', value: `/sync story ${story.id}` },
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
