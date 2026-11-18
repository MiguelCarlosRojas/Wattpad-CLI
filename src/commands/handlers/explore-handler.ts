import { CommandDefinition, CommandResult, ParsedCommand, RenderBlock } from '../../types/command.types';

export function createExploreCommands(): CommandDefinition[] {
  return [
    {
      name: '/explore',
      category: 'explore',
      description: 'Explora novelas populares en Wattpad organizadas por género',
      descriptionEn: 'Explores popular stories on Wattpad organized by genre',
      usage: '/explore [género]',
      examples: ['/explore', '/explore romance', '/explore fantasia', '/explore misterio'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const genre = parsed.subcommand || parsed.args[0] || 'Romance';
        const stories = await app.wattpadService.exploreCategory(genre, 6);

        const blocks: RenderBlock[] = [
          {
            type: 'card',
            title: `EXPLORAR: GÉNERO ${genre.toUpperCase()}`,
            subtitle: 'Historias destacadas en la comunidad de Wattpad',
            statusBadge: 'TENDENCIAS',
            statusColor: '#FF6122',
          },
        ];

        for (const st of stories) {
          blocks.push({
            type: 'card',
            title: st.title,
            subtitle: `Por @${st.author}`,
            statusBadge: `${st.reads.toLocaleString()} LECTURAS`,
            statusColor: '#17A2B8',
            fields: [
              { label: 'Sinopsis', value: st.description },
              { label: 'Estadísticas', value: `⭐ ${st.votes.toLocaleString()} votos | 📖 ${st.parts} partes` },
              { label: 'Etiquetas', value: st.tags.join(', ') },
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
      name: '/search',
      category: 'explore',
      description: 'Busca novelas públicas en Wattpad por título o palabras clave',
      descriptionEn: 'Searches public stories on Wattpad by title or keywords',
      usage: '/search "término de búsqueda"',
      examples: ['/search "el secreto"', '/search romance escolar'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const query = parsed.subcommand ? `${parsed.subcommand} ${parsed.args.join(' ')}`.trim() : parsed.args.join(' ');

        if (!query) {
          return {
            success: false,
            blocks: [
              {
                type: 'error',
                title: 'Término de búsqueda requerido',
                content: 'Uso: /search "nombre de la novela"\nEjemplo: /search "el secreto del bosque"',
              },
            ],
          };
        }

        const results = await app.wattpadService.searchStories(query, 6);

        const blocks: RenderBlock[] = [
          {
            type: 'card',
            title: `BÚSQUEDA EN WATTPAD: "${query}"`,
            subtitle: `Se encontraron ${results.length} resultado(s)`,
            statusBadge: 'BÚSQUEDA',
            statusColor: '#FF6122',
          },
        ];

        for (const st of results) {
          blocks.push({
            type: 'card',
            title: st.title,
            subtitle: `Autor: @${st.author}`,
            statusBadge: `${st.reads.toLocaleString()} LECTURAS`,
            statusColor: '#28A745',
            fields: [
              { label: 'Descripción', value: st.description },
              { label: 'Votos', value: String(st.votes) },
              { label: 'Capítulos', value: String(st.parts) },
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
