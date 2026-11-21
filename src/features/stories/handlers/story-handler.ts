import { CommandDefinition, CommandResult, ParsedCommand, RenderBlock } from '../../../core/types/command.types';
import { EditorPreference, RemoteWattpadStory, LocalManuscript, UnifiedStoryCatalog } from '../types/story.types';
import { formatStatusBadge } from '../../../core/utils/formatter';
import { InteractiveCatalogView, InteractiveMenuView, InteractiveDialogView, MenuItem } from '../../../platform/terminal/interactive';

/**
 * Función central de actualización ejecutada por /refresh y /stories refresh
 */
export async function executeRefresh(app: any, parsed?: ParsedCommand): Promise<CommandResult> {
  const force = parsed?.flags?.['force'] === true || !parsed?.flags?.['cached'];
  const catalog: UnifiedStoryCatalog = await app.refreshAll(force);

  const user = app.currentUser;
  const sessionStatus = user
    ? `Sesión activa como @${user.username}${user.name && user.name !== user.username ? ` · ${user.name}` : ''}`
    : 'Sin sesión activa (usa /login para conectar tu cuenta)';

  const publishedCount = catalog.publishedStories.length;
  const draftCount = catalog.wattpadDrafts.length;
  const localCount = catalog.localManuscripts.length;

  return {
    success: true,
    blocks: [
      {
        type: 'card',
        title: 'ACTUALIZACIÓN DEL CATÁLOGO COMPLETADA',
        subtitle: `Sincronización finalizada el ${new Date(catalog.lastSync).toLocaleTimeString('es-ES')}`,
        statusBadge: catalog.remoteSyncFailed ? 'MODO LOCAL' : 'ACTUALIZADO',
        statusColor: catalog.remoteSyncFailed ? '#FFC107' : '#28A745',
        fields: [
          { label: 'Estado de Sesión', value: sessionStatus },
          { label: 'Novelas Publicadas', value: `${publishedCount} obra(s) en Wattpad` },
          { label: 'Borradores en Wattpad', value: `${draftCount} obra(s) en Wattpad` },
          { label: 'Manuscritos Locales', value: `${localCount} archivo(s) (.docx, .txt)` },
          {
            label: 'Origen de Datos',
            value: catalog.remoteSyncFailed
              ? `Local / Caché (${catalog.errorMessage || 'Wattpad no disponible'})`
              : 'Wattpad Oficial (window.wattpad / prefetched) + Mis novelas',
          },
        ],
      },
    ],
    message: `Catálogo actualizado: ${publishedCount} publicadas, ${draftCount} borradores, ${localCount} manuscritos locales.`,
  };
}

export function createStoryCommands(): CommandDefinition[] {
  return [
    {
      name: '/stories',
      subcommands: ['search', 'drafts', 'published', 'borradores', 'publicadas', 'local', 'manuscritos', 'refresh', 'all'],
      category: 'stories',
      description: 'Muestra el catálogo unificado de novelas de Wattpad y manuscritos locales',
      descriptionEn: 'Shows unified catalog of Wattpad stories and local manuscripts',
      usage: '/stories [--published | --drafts | --local | --all | search <término> | refresh]',
      examples: [
        '/stories',
        '/stories --published',
        '/stories --drafts',
        '/stories --local',
        '/stories search "fantasía"',
        '/stories refresh',
      ],
      execute: async (app, parsed: ParsedCommand): Promise<CommandResult> => {
        // 1. Subcomando refresh
        if (parsed.subcommand === 'refresh' || parsed.args.includes('refresh')) {
          return await executeRefresh(app, parsed);
        }

        // Obtener historias remotas y locales
        let remoteStories: RemoteWattpadStory[] = app.remoteStories || [];
        let localManuscripts: LocalManuscript[] = app.localManuscripts || [];
        let localStories = app.storyRepo.findAll();

        // Si app.localManuscripts está vacío, escanear
        if (localManuscripts.length === 0 && app.fsManager) {
          localManuscripts = app.fsManager.scanLocalManuscripts();
          app.localManuscripts = localManuscripts;
        }

        // Si remoteStories está vacío y no estamos en pruebas vacías, intentar recuperar caché
        if (remoteStories.length === 0 && app.wattpadService) {
          const cached = app.wattpadService.getCachedRemoteWorks();
          if (cached && cached.stories) {
            remoteStories = cached.stories;
            app.remoteStories = remoteStories;
          }
        }

        let publishedStories = remoteStories.filter((s) => s.published);
        let wattpadDrafts = remoteStories.filter((s) => !s.published);

        // 2. Manejo de búsqueda: /stories search <query> o /stories <query>
        const isSearch =
          parsed.subcommand === 'search' ||
          parsed.args[0] === 'search' ||
          (parsed.args.length > 0 &&
            !['all', 'drafts', 'published', 'borradores', 'publicadas', 'local', 'manuscritos', 'refresh'].includes(
              parsed.args[0].toLowerCase()
            ) &&
            !parsed.args[0].startsWith('-'));

        if (isSearch) {
          const query = (
            parsed.subcommand === 'search'
              ? parsed.args.join(' ')
              : (parsed.args[0] === 'search' ? parsed.args.slice(1).join(' ') : parsed.args.join(' '))
          )
            .trim()
            .toLowerCase();

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

          const matchedPublished = publishedStories.filter(
            (s) =>
              s.title.toLowerCase().includes(query) ||
              s.genre.toLowerCase().includes(query) ||
              (s.description && s.description.toLowerCase().includes(query)) ||
              s.tags.some((t) => t.toLowerCase().includes(query))
          );

          const matchedDrafts = wattpadDrafts.filter(
            (s) =>
              s.title.toLowerCase().includes(query) ||
              s.genre.toLowerCase().includes(query) ||
              (s.description && s.description.toLowerCase().includes(query)) ||
              s.tags.some((t) => t.toLowerCase().includes(query))
          );

          const matchedManuscripts = localManuscripts.filter(
            (m) =>
              m.detectedTitle.toLowerCase().includes(query) ||
              m.filename.toLowerCase().includes(query) ||
              m.relativePath.toLowerCase().includes(query)
          );

          const matchedLocal = localStories.filter(
            (s: any) =>
              s.title.toLowerCase().includes(query) ||
              s.genre.toLowerCase().includes(query) ||
              (s.description && s.description.toLowerCase().includes(query)) ||
              (s.tags && s.tags.some((t: string) => t.toLowerCase().includes(query)))
          );

          const totalMatched =
            matchedPublished.length + matchedDrafts.length + matchedManuscripts.length + matchedLocal.length;

          if (totalMatched === 0) {
            return {
              success: true,
              blocks: [
                {
                  type: 'card',
                  title: `BÚSQUEDA DE NOVELAS: "${query}"`,
                  subtitle: 'Catálogo unificado de obras',
                  statusBadge: '0 COINCIDENCIAS',
                  statusColor: '#808080',
                  content: `No se encontraron novelas ni manuscritos que coincidan con "${query}".`,
                },
              ],
              message: `No se encontraron novelas que coincidan con "${query}".`,
            };
          }

          const searchBlocks: RenderBlock[] = [
            {
              type: 'card',
              title: `RESULTADOS DE BÚSQUEDA: "${query}"`,
              subtitle: `${totalMatched} obra(s) encontrada(s) en tu catálogo`,
              statusBadge: `${totalMatched} COINCIDENCIAS`,
              statusColor: '#17A2B8',
            },
          ];

          for (const s of matchedPublished) {
            searchBlocks.push({
              type: 'card',
              title: `${s.title} [ID: ${s.id}]`,
              subtitle: s.description ? s.description.slice(0, 90) : 'Sin sinopsis.',
              statusBadge: 'PUBLICADA EN WATTPAD',
              statusColor: '#28A745',
              fields: [
                { label: 'Identificador', value: String(s.id) },
                { label: 'Género', value: s.genre },
                { label: 'Capítulos', value: `${s.numParts} partes (${s.publishedCount} publicadas)` },
                { label: 'URL de Wattpad', value: s.url },
              ],
            });
          }

          for (const s of matchedDrafts) {
            searchBlocks.push({
              type: 'card',
              title: `${s.title} [ID: ${s.id}]`,
              subtitle: s.description ? s.description.slice(0, 90) : 'Sin sinopsis.',
              statusBadge: 'BORRADOR EN WATTPAD',
              statusColor: '#FFC107',
              fields: [
                { label: 'Identificador', value: String(s.id) },
                { label: 'Género', value: s.genre },
                { label: 'Estado', value: 'Borrador no publicado en Wattpad' },
                { label: 'Capítulos', value: `${s.numParts} capítulo(s) en borrador` },
                { label: 'URL de Wattpad', value: s.url },
              ],
            });
          }

          for (const m of matchedManuscripts) {
            searchBlocks.push({
              type: 'card',
              title: `${m.detectedTitle} (${m.format.toUpperCase()})`,
              subtitle: `Ruta: ${m.relativePath}`,
              statusBadge: 'MANUSCRITO LOCAL - PENDIENTE DE SUBIR A WATTPAD',
              statusColor: '#17A2B8',
              fields: [
                { label: 'Archivo', value: m.filename },
                { label: 'Formato', value: `.${m.format}` },
                { label: 'Capítulos Estimados', value: `${m.chapterCount} capítulo(s)` },
                { label: 'Estado', value: 'Solo disponible localmente' },
              ],
            });
          }

          for (const s of matchedLocal) {
            searchBlocks.push({
              type: 'card',
              title: `${s.title} [${s.id}]`,
              subtitle: s.description ? s.description.slice(0, 90) : 'Sin sinopsis.',
              statusBadge: 'LOCAL - EN PREPARACIÓN',
              statusColor: '#6C757D',
              fields: [
                { label: 'Género', value: s.genre },
                { label: 'Estado', value: 'Borrador local de la CLI' },
              ],
            });
          }

          return {
            success: true,
            blocks: searchBlocks,
          };
        }

        // 3. Filtros
        const filterArg = (parsed.subcommand || parsed.args[0] || '').toLowerCase();
        const filterPublished =
          parsed.flags['published'] === true ||
          filterArg === 'published' ||
          filterArg === 'publicadas' ||
          parsed.args.includes('--published');
        const filterDrafts =
          parsed.flags['drafts'] === true ||
          filterArg === 'drafts' ||
          filterArg === 'borradores' ||
          parsed.args.includes('--drafts');
        const filterLocal =
          parsed.flags['local'] === true ||
          filterArg === 'local' ||
          filterArg === 'manuscritos' ||
          parsed.args.includes('--local');

        // Caso filtro de publicadas
        if (filterPublished) {
          if (publishedStories.length === 0) {
            return {
              success: true,
              blocks: [
                {
                  type: 'card',
                  title: 'NOVELAS PUBLICADAS EN WATTPAD',
                  subtitle: 'Filtro: Solo publicadas',
                  statusBadge: '0 PUBLICADAS',
                  statusColor: '#808080',
                  content: 'No tienes novelas publicadas actualmente en tu cuenta de Wattpad.',
                },
              ],
              message: 'No tienes novelas publicadas en Wattpad.',
            };
          }

          const blocks: RenderBlock[] = [
            {
              type: 'card',
              title: 'NOVELAS PUBLICADAS EN WATTPAD',
              subtitle: `${publishedStories.length} obra(s) pública(s) en tu cuenta`,
              statusBadge: `${publishedStories.length} PUBLICADAS`,
              statusColor: '#28A745',
            },
          ];

          for (const s of publishedStories) {
            blocks.push({
              type: 'card',
              title: `${s.title} [ID: ${s.id}]`,
              subtitle: s.description ? s.description.slice(0, 100) : 'Sin descripción.',
              statusBadge: 'PUBLICADA EN WATTPAD',
              statusColor: '#28A745',
              fields: [
                { label: 'Identificador', value: String(s.id) },
                { label: 'Género', value: s.genre },
                { label: 'Capítulos', value: `${s.numParts} partes (${s.publishedCount} publicadas)` },
                {
                  label: 'Lecturas / Votos',
                  value: `${(s.readCount || 0).toLocaleString()} lecturas · ${(s.voteCount || 0).toLocaleString()} votos`,
                },
                {
                  label: 'Última modificación',
                  value: s.lastModified ? new Date(s.lastModified).toLocaleDateString('es-ES') : 'No disponible',
                },
                { label: 'URL de Wattpad', value: s.url },
              ],
            });
          }

          return { success: true, blocks };
        }

        // Caso filtro de borradores
        if (filterDrafts) {
          if (wattpadDrafts.length === 0) {
            return {
              success: true,
              blocks: [
                {
                  type: 'card',
                  title: 'BORRADORES EN WATTPAD',
                  subtitle: 'Filtro: Solo borradores de Wattpad',
                  statusBadge: '0 BORRADORES',
                  statusColor: '#808080',
                  content: 'No tienes borradores guardados actualmente en tu cuenta de Wattpad.',
                },
              ],
              message: 'No tienes borradores guardados en Wattpad.',
            };
          }

          const blocks: RenderBlock[] = [
            {
              type: 'card',
              title: 'BORRADORES EN WATTPAD',
              subtitle: `${wattpadDrafts.length} obra(s) en borrador dentro de Wattpad`,
              statusBadge: `${wattpadDrafts.length} BORRADORES`,
              statusColor: '#FFC107',
            },
          ];

          for (const s of wattpadDrafts) {
            blocks.push({
              type: 'card',
              title: `${s.title} [ID: ${s.id}]`,
              subtitle: s.description ? s.description.slice(0, 100) : 'Sin sinopsis.',
              statusBadge: 'BORRADOR EN WATTPAD',
              statusColor: '#FFC107',
              fields: [
                { label: 'Identificador', value: String(s.id) },
                { label: 'Género', value: s.genre },
                { label: 'Estado', value: 'Borrador en Wattpad (no publicado)' },
                { label: 'Número de Capítulos', value: `${s.numParts} capítulo(s) en borrador` },
                {
                  label: 'Última modificación',
                  value: s.lastModified ? new Date(s.lastModified).toLocaleDateString('es-ES') : 'No disponible',
                },
                { label: 'URL de Wattpad', value: s.url },
              ],
            });
          }

          return { success: true, blocks };
        }

        // Caso filtro local
        if (filterLocal) {
          const totalLocal = localManuscripts.length + localStories.length;
          if (totalLocal === 0) {
            return {
              success: true,
              blocks: [
                {
                  type: 'card',
                  title: 'MANUSCRITOS LOCALES',
                  subtitle: 'Filtro: Solo manuscritos y novelas locales',
                  statusBadge: '0 LOCALES',
                  statusColor: '#808080',
                  content: 'No tienes manuscritos locales pendientes de subir en "Mis novelas".',
                },
              ],
              message: 'No tienes manuscritos locales pendientes.',
            };
          }

          const blocks: RenderBlock[] = [
            {
              type: 'card',
              title: 'MANUSCRITOS LOCALES (PENDIENTES DE SUBIR A WATTPAD)',
              subtitle: `${localManuscripts.length} manuscrito(s) detectados en "Mis novelas"`,
              statusBadge: `${localManuscripts.length} ARCHIVOS`,
              statusColor: '#17A2B8',
            },
          ];

          for (const m of localManuscripts) {
            blocks.push({
              type: 'card',
              title: `${m.detectedTitle} (${m.format.toUpperCase()})`,
              subtitle: `Ruta: ${m.relativePath}`,
              statusBadge: 'MANUSCRITO LOCAL - PENDIENTE DE SUBIR A WATTPAD',
              statusColor: '#17A2B8',
              fields: [
                { label: 'Archivo', value: m.filename },
                { label: 'Título Detectado', value: m.detectedTitle },
                { label: 'Formato', value: `.${m.format}` },
                { label: 'Capítulos Estimados', value: `${m.chapterCount} capítulo(s)` },
                { label: 'Tamaño', value: `${(m.sizeBytes / 1024).toFixed(1)} KB` },
                { label: 'Última Modificación', value: m.lastModified },
                { label: 'Estado', value: 'Solo disponible localmente / No sincronizado con Wattpad' },
              ],
            });
          }

          for (const story of localStories) {
            const chapters = app.chapterRepo.findByStoryId(story.id);
            const badge = formatStatusBadge(story.status);
            blocks.push({
              type: 'card',
              title: `${story.title} [${story.id}]`,
              subtitle: story.description ? story.description.slice(0, 90) : 'Sin sinopsis.',
              statusBadge: 'LOCAL - EN PREPARACIÓN',
              statusColor: badge.color,
              fields: [
                { label: 'Género', value: story.genre },
                { label: 'Editor Preferido', value: story.editorPreference.toUpperCase() },
                { label: 'Capítulos', value: `${chapters.length} capítulo(s)` },
                { label: 'Estado', value: 'Borrador local en preparación' },
              ],
            });
          }

          return { success: true, blocks };
        }

        // 4. Vista general unificada (todas las obras)
        const totalAll =
          publishedStories.length + wattpadDrafts.length + localManuscripts.length + localStories.length;

        if (totalAll === 0) {
          return {
            success: true,
            blocks: [
              {
                type: 'card',
                title: 'MIS NOVELAS',
                subtitle: 'Catálogo de obras',
                statusBadge: '0 NOVELAS',
                statusColor: '#808080',
                content:
                  'No tienes novelas disponibles en esta cuenta.\nUsa /story create "Título" para crear tu primera novela.',
              },
            ],
            message: 'No tienes novelas disponibles en esta cuenta.',
          };
        }

        const blocks: RenderBlock[] = [
          {
            type: 'card',
            title: 'CATÁLOGO UNIFICADO DE OBRAS',
            subtitle: `${publishedStories.length} publicadas · ${wattpadDrafts.length} borradores en Wattpad · ${localManuscripts.length} manuscritos locales`,
            statusBadge: `${totalAll} OBRAS`,
            statusColor: '#FF6122',
          },
        ];

        // Sección 1: Publicadas en Wattpad
        for (const s of publishedStories) {
          blocks.push({
            type: 'card',
            title: `${s.title} [ID: ${s.id}]`,
            subtitle: s.description ? s.description.slice(0, 100) : 'Sin descripción.',
            statusBadge: 'PUBLICADA EN WATTPAD',
            statusColor: '#28A745',
            fields: [
              { label: 'Identificador', value: String(s.id) },
              { label: 'Género', value: s.genre },
              { label: 'Capítulos', value: `${s.numParts} partes (${s.publishedCount} publicadas)` },
              {
                label: 'Lecturas / Votos',
                value: `${(s.readCount || 0).toLocaleString()} lecturas · ${(s.voteCount || 0).toLocaleString()} votos`,
              },
              {
                label: 'Última modificación',
                value: s.lastModified ? new Date(s.lastModified).toLocaleDateString('es-ES') : 'No disponible',
              },
              { label: 'URL de Wattpad', value: s.url },
            ],
          });
        }

        // Sección 2: Borradores en Wattpad
        for (const s of wattpadDrafts) {
          blocks.push({
            type: 'card',
            title: `${s.title} [ID: ${s.id}]`,
            subtitle: s.description ? s.description.slice(0, 100) : 'Sin sinopsis.',
            statusBadge: 'BORRADOR EN WATTPAD',
            statusColor: '#FFC107',
            fields: [
              { label: 'Identificador', value: String(s.id) },
              { label: 'Género', value: s.genre },
              { label: 'Estado', value: 'Borrador en Wattpad (no publicado)' },
              { label: 'Número de Capítulos', value: `${s.numParts} capítulo(s) en borrador` },
              {
                label: 'Última modificación',
                value: s.lastModified ? new Date(s.lastModified).toLocaleDateString('es-ES') : 'No disponible',
              },
              { label: 'URL de Wattpad', value: s.url },
            ],
          });
        }

        // Sección 3: Manuscritos Locales
        for (const m of localManuscripts) {
          blocks.push({
            type: 'card',
            title: `${m.detectedTitle} (${m.format.toUpperCase()})`,
            subtitle: `Ruta: ${m.relativePath}`,
            statusBadge: 'MANUSCRITO LOCAL - PENDIENTE DE SUBIR A WATTPAD',
            statusColor: '#17A2B8',
            fields: [
              { label: 'Archivo', value: m.filename },
              { label: 'Título Detectado', value: m.detectedTitle },
              { label: 'Formato', value: `.${m.format}` },
              { label: 'Capítulos Estimados', value: `${m.chapterCount} capítulo(s)` },
              { label: 'Tamaño', value: `${(m.sizeBytes / 1024).toFixed(1)} KB` },
              { label: 'Última Modificación', value: m.lastModified },
              { label: 'Estado', value: 'Solo disponible localmente / No sincronizado con Wattpad' },
            ],
          });
        }

        // Sección 4: Novelas Locales en Memoria / Workspace
        for (const story of localStories) {
          const chapters = app.chapterRepo.findByStoryId(story.id);
          const badge = formatStatusBadge(story.status);
          const totalWords = chapters.reduce((sum: number, ch: any) => sum + ch.wordCount, 0);

          blocks.push({
            type: 'card',
            title: `${story.title} [${story.id}]`,
            subtitle: story.description ? story.description.slice(0, 90) : 'Sin sinopsis.',
            statusBadge: 'LOCAL - EN PREPARACIÓN',
            statusColor: badge.color,
            fields: [
              { label: 'Género', value: story.genre },
              { label: 'Editor Preferido', value: story.editorPreference.toUpperCase() },
              { label: 'Capítulos', value: `${chapters.length} capítulo(s)` },
              { label: 'Palabras Totales', value: `${totalWords.toLocaleString()} palabras` },
              { label: 'Estado Local', value: story.status === 'published' ? 'Marcado para publicación' : 'Borrador local' },
              { label: 'Identificador Wattpad', value: story.wattpadId || 'Pendiente de sincronización' },
            ],
          });
        }

        if (app.appShell && !filterPublished && !filterDrafts && !filterLocal && !isSearch) {
          app.appShell.pushView(
            new InteractiveCatalogView({
              publishedStories,
              draftStories: wattpadDrafts,
              localManuscripts,
              onAction: async (actionId, item) => {
                if (actionId === 'open' && item.id) {
                  app.currentStoryId = item.id;
                  app.appShell.setState({ activeStoryId: item.id });
                  app.appShell.setNotification(`✓ Novela activa: ${item.title || item.id}`);
                } else if (actionId === 'chapters') {
                  const chapCmd = app.registry.get('/chapters');
                  if (chapCmd) chapCmd.execute(app, { command: '/chapters', args: [], flags: {} });
                }
              },
            })
          );
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
          if (app.appShell) {
            const storyMenuItems: MenuItem[] = [
              {
                id: 'create',
                label: '1. Crear nueva novela',
                description: 'Crear una nueva obra en tu catálogo local',
                action: () => {
                  const title = 'Nueva Novela';
                  const created = app.storyRepo.create({ title, genre: 'General', editorPreference: 'word' });
                  app.currentStoryId = created.id;
                  app.appShell.setState({ activeStoryId: created.id, stories: app.storyRepo.findAll() });
                  app.appShell.setNotification(`✓ Creada novela: ${created.title} [${created.id}]`);
                },
              },
              {
                id: 'open',
                label: '2. Abrir novela existente',
                description: 'Seleccionar novela activa del catálogo',
                action: () => {
                  const storiesDef = app.registry.get('/stories');
                  if (storiesDef) storiesDef.execute(app, { command: '/stories', args: [], flags: {} });
                },
              },
              {
                id: 'edit',
                label: '3. Editar información de novela activa',
                description: 'Modificar título, sinopsis o género de la obra seleccionada',
              },
              {
                id: 'delete',
                label: '4. Eliminar novela',
                description: 'Eliminar una novela y sus capítulos locales con confirmación',
              },
              {
                id: 'info',
                label: '5. Información de novela activa',
                description: 'Ver estadísticas y detalles de la obra actual',
              },
              {
                id: 'link',
                label: '6. Vincular con manuscrito local',
                description: 'Asociar archivo Word (.docx) o Bloc de Notas (.txt)',
              },
            ];
            app.appShell.pushView(
              new InteractiveMenuView({
                id: 'story-operations-menu',
                title: 'OPERACIONES DE NOVELA',
                subtitle: 'Navega con ↑/↓ y pulsa Enter para seleccionar una opción:',
                items: storyMenuItems,
              })
            );
          }

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
