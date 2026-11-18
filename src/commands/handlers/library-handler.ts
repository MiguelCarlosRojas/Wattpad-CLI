import { CommandDefinition, CommandResult, ParsedCommand } from '../../types/command.types';

export function createLibraryCommands(): CommandDefinition[] {
  return [
    {
      name: '/library',
      subcommands: ['list', 'search'],
      category: 'library',
      description: 'Consulta tus novelas guardadas y listas de lectura',
      descriptionEn: 'View saved stories and reading lists',
      usage: '/library [list | search "término"]',
      examples: ['/library', '/library list', '/library search "fantasía"'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const sub = parsed.subcommand;
        const localStories = app.storyRepo.findAll();

        if (sub === 'search') {
          const query = parsed.args.join(' ').toLowerCase();
          const matches = localStories.filter(
            (s) =>
              s.title.toLowerCase().includes(query) ||
              s.genre.toLowerCase().includes(query) ||
              s.tags.some((t) => t.toLowerCase().includes(query))
          );

          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: `RESULTADOS DE BÚSQUEDA EN BIBLIOTECA ("${query}")`,
                statusBadge: `${matches.length} COINCIDENCIAS`,
                statusColor: '#17A2B8',
                items: matches.map((s) => ({
                  primary: `${s.title} [${s.id}]`,
                  secondary: `Género: ${s.genre} | Idioma: ${s.language} | Estado: ${s.status}`,
                })),
              },
            ],
          };
        }

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'BIBLIOTECA PERSONAL',
              subtitle: 'Novelas locales y obras en desarrollo',
              statusBadge: `${localStories.length} NOVELAS`,
              statusColor: '#FF6122',
              items: localStories.length > 0
                ? localStories.map((s) => ({
                    primary: `${s.title} [${s.id}]`,
                    secondary: `Género: ${s.genre} | Editor: ${s.editorPreference} | Estado: ${s.status}`,
                    badge: s.status.toUpperCase(),
                  }))
                : [
                    {
                      primary: 'No hay novelas en tu biblioteca.',
                      secondary: 'Usa /story new para crear tu primera novela.',
                    },
                  ],
            },
          ],
        };
      },
    },
  ];
}
