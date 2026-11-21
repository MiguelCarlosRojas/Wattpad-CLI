import { CommandDefinition, CommandResult, ParsedCommand } from '../../../core/types/command.types';
import { DiscoveryFilter } from '../../../platform/wattpad/discovery.types';
import { DiscoveryView } from '../../../platform/terminal/components/discovery-view';
import { InteractiveDiscoverView } from '../../../platform/terminal/interactive';

export function createDiscoveryCommands(): CommandDefinition[] {
  return [
    {
      name: '/discover',
      category: 'discovery',
      description: 'Explora novelas de Wattpad por categorías, filtros o búsqueda natural',
      descriptionEn: 'Discovers Wattpad stories by categories, filters, or natural language search',
      usage: '/discover [opciones | categoría]',
      examples: ['/discover', '/discover fantasía', '/discover romance'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        if (!app.currentUser) {
          return {
            success: false,
            blocks: [
              {
                type: 'error',
                title: 'AUTENTICACIÓN REQUERIDA EN WATTPAD',
                subtitle: 'Para buscar y descubrir novelas necesitas una sesión activa',
                statusBadge: 'NO AUTORIZADO',
                statusColor: '#F97066',
                content:
                  'La exploración del catálogo de Wattpad requiere que estés autenticado con tu cuenta oficial.\n\n' +
                  'Ejecuta /login para conectar tu cuenta de manera legítima.',
              },
            ],
            message: 'Debes iniciar sesión con tu cuenta oficial de Wattpad para explorar novelas. Usa /login.',
          };
        }

        const categoryOrQuery = parsed.subcommand || parsed.args.join(' ');
        const filter: DiscoveryFilter = {
          genre: categoryOrQuery || undefined,
          status: 'all',
          sort: 'hot',
        };

        const result = await app.discoveryService.search(filter);

        if (app.appShell) {
          app.appShell.pushView(
            new InteractiveDiscoverView({
              initialQuery: categoryOrQuery,
              results: result.stories.map((s) => ({
                id: s.id,
                title: s.title,
                author: s.author.username,
                description: s.description,
                reads: (s.readCount || 0).toLocaleString(),
                votes: (s.voteCount || 0).toLocaleString(),
                parts: s.numParts || 1,
                tags: s.tags,
                url: s.url,
              })),
            })
          );
        }

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'DESCUBRIR NOVELAS EN WATTPAD',
              subtitle: `Mostrando novelas para @${app.currentUser.username}`,
              statusBadge: `${result.stories.length} RESULTADOS`,
              statusColor: '#FF6122',
            },
            ...result.stories.map((s) => ({
              type: 'card' as const,
              title: `${s.title}`,
              subtitle: `por @${s.author.username} · ${s.genre} · ${s.status === 'completed' ? 'Completada' : 'En curso'}`,
              statusBadge: s.status === 'completed' ? 'COMPLETADA' : 'EN CURSO',
              statusColor: s.status === 'completed' ? '#32D583' : '#FEC84B',
              fields: [
                { label: 'Lecturas', value: (s.readCount || 0).toLocaleString() },
                { label: 'Votos', value: (s.voteCount || 0).toLocaleString() },
                { label: 'Capítulos', value: `${s.numParts || 1}` },
                { label: 'Sinopsis', value: s.description ? s.description.slice(0, 140) + '...' : 'Sin sinopsis' },
                { label: 'Enlace Wattpad', value: s.url },
              ],
            })),
          ],
          message: `Se encontraron ${result.stories.length} novelas en Wattpad.`,
        };
      },
    },

    {
      name: '/search',
      category: 'discovery',
      description: 'Busca novelas en Wattpad con filtros estructurados o lenguaje natural',
      descriptionEn: 'Searches Wattpad stories using structured filters or natural language',
      usage: '/search <texto de búsqueda o frase descriptiva> [--genre=...] [--completed] [--ongoing]',
      examples: [
        '/search "misterio en una mansión"',
        '/search novelas de terror en español terminadas con más de 1000 lecturas',
        '/search fantasía --completed',
      ],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        if (!app.currentUser) {
          return {
            success: false,
            blocks: [
              {
                type: 'error',
                title: 'AUTENTICACIÓN REQUERIDA EN WATTPAD',
                subtitle: 'Para buscar novelas necesitas una sesión activa',
                statusBadge: 'NO AUTORIZADO',
                statusColor: '#F97066',
                content:
                  'La búsqueda en el catálogo de Wattpad requiere que estés autenticado con tu cuenta oficial.\n\n' +
                  'Ejecuta /login para conectar tu cuenta de manera legítima.',
              },
            ],
            message: 'Debes iniciar sesión con tu cuenta oficial de Wattpad para buscar novelas. Usa /login.',
          };
        }

        const rawText = parsed.args.length > 0
          ? (parsed.subcommand ? `${parsed.subcommand} ${parsed.args.join(' ')}` : parsed.args.join(' '))
          : (parsed.subcommand || '');

        if (!rawText && !parsed.flags.genre) {
          return {
            success: false,
            blocks: [
              {
                type: 'warning',
                title: 'PARÁMETROS DE BÚSQUEDA REQUERIDOS',
                content:
                  'Ingresa un término de búsqueda o una descripción en lenguaje natural.\n\n' +
                  'Ejemplos:\n' +
                  '› /search misterio\n' +
                  '› /search novelas de romance terminadas con más de 5000 lecturas\n' +
                  '› /search fantasía --completed',
              },
            ],
            message: 'Ingresa un término o frase para buscar novelas.',
          };
        }

        // Parseo con Modo B (Lenguaje natural) o Modo A (Filtros explícitos)
        const filter = app.discoveryService.parseNaturalQuery(rawText);

        if (parsed.flags.genre) {
          filter.genre = String(parsed.flags.genre);
        }
        if (parsed.flags.completed || parsed.flags.terminada) {
          filter.status = 'completed';
        } else if (parsed.flags.ongoing || parsed.flags['en-curso']) {
          filter.status = 'ongoing';
        }
        if (parsed.flags.sort) {
          filter.sort = parsed.flags.sort as any;
        }

        const result = await app.discoveryService.search(filter);

        if (app.appShell) {
          app.appShell.pushView(
            new InteractiveDiscoverView({
              initialQuery: filter.query || rawText,
              results: result.stories.map((s) => ({
                id: s.id,
                title: s.title,
                author: s.author.username,
                description: s.description,
                reads: (s.readCount || 0).toLocaleString(),
                votes: (s.voteCount || 0).toLocaleString(),
                parts: s.numParts || 1,
                tags: s.tags,
                url: s.url,
              })),
            })
          );
        }

        if (result.stories.length === 0) {
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'BÚSQUEDA EN WATTPAD',
                subtitle: `Consulta: "${filter.query || rawText}"`,
                statusBadge: '0 RESULTADOS',
                statusColor: '#808080',
                content: 'No se encontraron novelas que coincidan exactamente con tu criterio. Prueba con términos más amplios.',
              },
            ],
            message: `0 novelas encontradas para "${filter.query || rawText}".`,
          };
        }

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: `RESULTADOS DE BÚSQUEDA EN WATTPAD`,
              subtitle: `Término: "${filter.query || rawText}" ${filter.genre ? `· Género: ${filter.genre}` : ''}`,
              statusBadge: `${result.stories.length} ENCONTRADAS`,
              statusColor: '#FF6122',
            },
            ...result.stories.map((s) => ({
              type: 'card' as const,
              title: `${s.title}`,
              subtitle: `por @${s.author.username} · ${s.genre} · ${s.status === 'completed' ? 'Completada' : 'En curso'}`,
              statusBadge: s.status === 'completed' ? 'COMPLETADA' : 'EN CURSO',
              statusColor: s.status === 'completed' ? '#32D583' : '#FEC84B',
              fields: [
                { label: 'Lecturas', value: (s.readCount || 0).toLocaleString() },
                { label: 'Votos', value: (s.voteCount || 0).toLocaleString() },
                { label: 'Capítulos', value: `${s.numParts || 1}` },
                { label: 'Sinopsis', value: s.description ? s.description.slice(0, 140) + '...' : 'Sin sinopsis' },
                { label: 'Enlace', value: s.url },
              ],
            })),
          ],
          message: `Se encontraron ${result.stories.length} novelas en Wattpad.`,
        };
      },
    },

    {
      name: '/buscar',
      category: 'discovery',
      description: 'Busca novelas y autores directamente en Wattpad',
      descriptionEn: 'Searches stories and authors directly on Wattpad',
      usage: '/buscar <término> [--genre=Fantasía] [--completed]',
      examples: ['/buscar misterio', '/buscar romance --completed'],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        const cmd = app.registry.get('/search');
        if (cmd) return await cmd.execute(app, parsed);
        return { success: false, message: 'Comando no disponible' };
      },
    },
  ];
}
