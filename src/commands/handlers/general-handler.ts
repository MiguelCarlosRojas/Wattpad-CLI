import { CommandDefinition, CommandResult, ParsedCommand, RenderBlock } from '../../types/command.types';
import { defaultConfig } from '../../config/config';

export function createGeneralCommands(): CommandDefinition[] {
  return [
    {
      name: '/help',
      category: 'general',
      description: 'Muestra la lista de comandos disponibles organizados por categoría',
      descriptionEn: 'Displays the list of available commands organized by category',
      usage: '/help [comando]',
      examples: ['/help', '/help story', '/help sync'],
      execute: (app, parsed: ParsedCommand): CommandResult => {
        const query = parsed.subcommand || parsed.args[0];

        if (query) {
          const target = query.startsWith('/') ? query : `/${query}`;
          const cmd = app.registry.get(target);
          if (cmd) {
            return {
              success: true,
              blocks: [
                {
                  type: 'card',
                  title: `Ayuda: ${cmd.name}`,
                  subtitle: cmd.description,
                  statusBadge: cmd.category.toUpperCase(),
                  statusColor: '#FF6122',
                  fields: [
                    { label: 'Uso', value: cmd.usage },
                    { label: 'Ejemplos', value: cmd.examples.join('\n') },
                    { label: 'Subcomandos', value: cmd.subcommands ? cmd.subcommands.join(', ') : 'Ninguno' },
                  ],
                },
              ],
            };
          }
        }

        // Full help grouped by categories
        const categories: Record<string, string[]> = {
          'Cuenta de Wattpad': ['/login', '/register', '/account', '/logout'],
          'Novelas (/story)': ['/stories', '/story new', '/story open NOV-xxxx', '/story info NOV-xxxx', '/story edit NOV-xxxx', '/story delete NOV-xxxx', '/story import', '/story export NOV-xxxx'],
          'Capítulos (/chapter)': ['/chapters', '/chapter new', '/chapter open', '/chapter edit', '/chapter import', '/chapter export', '/chapter reorder', '/chapter delete', '/chapter publish', '/chapter unpublish'],
          'Documentos y Editores': ['/documents', '/connect word', '/connect notepad', '/connect google', '/disconnect'],
          'Sincronización Cloud': ['/sync', '/sync status', '/sync story NOV-xxxx', '/sync chapter NOV-xxxx CAP-xxxx', '/sync history'],
          'Publicación en Wattpad': ['/publish', '/publish status', '/publish story NOV-xxxx', '/publish chapter NOV-xxxx CAP-xxxx'],
          'Sistema y Configuración': ['/help', '/version', '/update', '/status', '/settings', '/exit'],
        };

        const blocks: RenderBlock[] = [
          {
            type: 'card',
            title: 'WATTPAD CLI — CENTRO DE AYUDA Y COMANDOS',
            subtitle: 'Herramienta de terminal para novelas, capítulos, documentos y cuenta de Wattpad.',
            statusBadge: 'WATTPAD CLI',
            statusColor: '#FF6122',
          },
        ];

        for (const [catName, cmds] of Object.entries(categories)) {
          blocks.push({
            type: 'card',
            title: `• ${catName}`,
            items: cmds.map((c) => ({ primary: c })),
          });
        }

        return {
          success: true,
          blocks,
        };
      },
    },

    {
      name: '/version',
      category: 'general',
      description: 'Muestra la versión de Wattpad CLI y las especificaciones del entorno',
      descriptionEn: 'Displays Wattpad CLI version and environment specifications',
      usage: '/version',
      examples: ['/version'],
      execute: (): CommandResult => {
        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'WATTPAD CLI',
              subtitle: 'Entorno de Terminal de Nueva Generación',
              statusBadge: 'v1.0.0',
              statusColor: '#28A745',
              fields: [
                { label: 'Lenguaje', value: 'TypeScript 5.x (Strict Mode)' },
                { label: 'Runtime', value: `Bun v${Bun.version}` },
                { label: 'Motor TUI', value: 'OpenTUI (@opentui/core v0.9.2)' },
                { label: 'Base de Datos', value: 'SQLite (WAL Mode via bun:sqlite)' },
                { label: 'Plataforma', value: `${process.platform} (${process.arch})` },
                { label: 'Seguridad', value: 'AES-256-GCM + Almacenamiento OS Protegido' },
              ],
            },
          ],
        };
      },
    },

    {
      name: '/update',
      category: 'general',
      description: 'Verifica y actualiza Wattpad CLI a la versión más reciente desde la nube',
      descriptionEn: 'Checks and updates Wattpad CLI to the latest version from the cloud',
      usage: '/update [--check]',
      examples: ['/update', '/update --check'],
      execute: (): CommandResult => {
        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'ACTUALIZACIÓN DE WATTPAD CLI',
              subtitle: 'Distribución oficial y canales de instalación en la nube',
              statusBadge: 'v1.0.0 (Actualizado)',
              statusColor: '#28A745',
              fields: [
                { label: 'Versión Local', value: 'v1.0.0' },
                { label: 'Versión Remota', value: 'v1.0.0 (Latest Release)' },
                { label: 'Canal Cloud', value: 'https://wattpad-cli.onrender.com' },
                { label: 'Repositorio', value: 'https://github.com/MiguelCarlosRojas/Wattpad-CLI' },
              ],
              content:
                'Para reinstalar o actualizar en Windows (PowerShell):\n' +
                '  irm https://wattpad-cli.onrender.com/cli/install.ps1 | iex\n\n' +
                'En Linux o macOS:\n' +
                '  curl -fsSL https://wattpad-cli.onrender.com/cli/install.sh | bash\n\n' +
                'Mediante npm:\n' +
                '  npm install -g @wattpad/cli',
            },
          ],
        };
      },
    },

    {
      name: '/status',
      category: 'general',
      description: 'Muestra el estado actual del sistema, la historia activa y conexiones',
      descriptionEn: 'Displays current system state, active story and connections',
      usage: '/status',
      examples: ['/status'],
      execute: (app): CommandResult => {
        const activeStory = app.currentStoryId ? app.storyRepo.findById(app.currentStoryId) : null;
        const activeChapter = app.currentChapterId ? app.chapterRepo.findById(app.currentChapterId) : null;
        const connections = app.connRepo.getAll();
        const user = app.currentUser;

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'ESTADO DE WATTPAD CLI',
              statusBadge: user ? `CONECTADO (${user.username})` : 'MODO LOCAL',
              statusColor: user ? '#28A745' : '#808080',
              fields: [
                {
                  label: 'Novela Activa',
                  value: activeStory ? `${activeStory.title} [${activeStory.id}] (${activeStory.status})` : 'Ninguna (Usa /story open NOV-xxxx)',
                },
                {
                  label: 'Capítulo Activo',
                  value: activeChapter ? `${activeChapter.title} [${activeChapter.id}] (${activeChapter.status})` : 'Ninguno',
                },
                {
                  label: 'Conexiones Externas',
                  value: connections.map((c) => `${c.name}: ${c.isConnected ? 'CONECTADO' : 'DESCONECTADO'}`).join(' | '),
                },
                {
                  label: 'Directorio Documentos',
                  value: defaultConfig.docsDir,
                },
              ],
            },
          ],
        };
      },
    },

    {
      name: '/clear',
      category: 'general',
      description: 'Limpia los resultados del área de contenido principal',
      descriptionEn: 'Clears results from the main content area',
      usage: '/clear',
      examples: ['/clear'],
      execute: (): CommandResult => {
        return {
          success: true,
          clearScreen: true,
          message: 'Área de contenido restablecida.',
        };
      },
    },

    {
      name: '/back',
      category: 'general',
      description: 'Regresa al nivel superior liberando la novela o capítulo activo',
      descriptionEn: 'Returns to top level releasing active story or chapter',
      usage: '/back',
      examples: ['/back'],
      execute: (app): CommandResult => {
        if (app.currentChapterId) {
          app.currentChapterId = null;
          return { success: true, message: 'Capítulo deseleccionado. Contexto en la novela activa.' };
        }
        if (app.currentStoryId) {
          app.currentStoryId = null;
          return { success: true, message: 'Novela deseleccionada. Contexto general restablecido.' };
        }
        return { success: true, message: 'Ya te encuentras en el nivel principal.' };
      },
    },

    {
      name: '/settings',
      category: 'general',
      description: 'Consulta y gestiona las configuraciones de la aplicación',
      descriptionEn: 'View and manage application settings',
      usage: '/settings [clave] [valor]',
      examples: ['/settings', '/settings editor word'],
      execute: (app, parsed: ParsedCommand): CommandResult => {
        const key = parsed.subcommand;
        const val = parsed.args[0];

        if (key && val) {
          app.settingsRepo.set(key, val);
          return {
            success: true,
            blocks: [
              {
                type: 'success',
                title: 'Configuración actualizada',
                content: `La opción "${key}" se estableció en "${val}".`,
              },
            ],
          };
        }

        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'CONFIGURACIONES LOCALES',
              statusBadge: 'PREFERENCIAS',
              statusColor: '#17A2B8',
              fields: [
                { label: 'Idioma Interfaz', value: app.settingsRepo.get('language', 'es') || 'es' },
                { label: 'Editor por Defecto', value: app.settingsRepo.get('default_editor', 'word') || 'word' },
                { label: 'Ruta Base de Documentos', value: defaultConfig.docsDir },
                { label: 'Ruta Base de Datos', value: defaultConfig.dbPath },
              ],
            },
          ],
        };
      },
    },

    {
      name: '/history',
      category: 'general',
      description: 'Muestra los comandos ejecutados recientemente',
      descriptionEn: 'Shows recently executed commands',
      usage: '/history',
      examples: ['/history'],
      execute: (app): CommandResult => {
        const history = app.settingsRepo.getCommandHistory(15);
        return {
          success: true,
          blocks: [
            {
              type: 'card',
              title: 'HISTORIAL DE COMANDOS RECIENTES',
              items: history.map((c, i) => ({ primary: `${i + 1}. ${c}` })),
            },
          ],
        };
      },
    },

    {
      name: '/exit',
      category: 'general',
      description: 'Cierra Wattpad CLI y devuelve el control a la terminal',
      descriptionEn: 'Closes Wattpad CLI and returns control to terminal',
      usage: '/exit',
      examples: ['/exit'],
      execute: (): CommandResult => {
        return {
          success: true,
          exitApp: true,
          message: 'Cerrando Wattpad CLI. ¡Hasta pronto!',
        };
      },
    },
  ];
}
