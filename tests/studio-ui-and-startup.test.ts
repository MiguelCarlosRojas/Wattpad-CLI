import { describe, expect, it } from 'bun:test';
import { AppShell } from '../src/cli/terminal/app-shell';
import { WorkspaceNavigation, NAV_ITEMS } from '../src/cli/terminal/components/workspace-navigation';
import { Header } from '../src/cli/terminal/components/header';
import { CommandInput } from '../src/cli/terminal/components/command-input';
import { SuggestionsDropdown } from '../src/cli/terminal/components/suggestions';
import { StatusBar } from '../src/cli/terminal/components/status-bar';
import { ProjectContext } from '../src/cli/terminal/components/project-context';
import { LoadingState, EmptyState, ErrorState } from '../src/cli/terminal/components/states';
import { HomeView } from '../src/cli/terminal/views/home-view';
import { LibraryView } from '../src/cli/terminal/views/library-view';
import { ChapterView } from '../src/cli/terminal/views/chapter-view';
import { DocumentsView } from '../src/cli/terminal/views/documents-view';
import { CommandOutputView } from '../src/cli/terminal/views/output-view';
import { ResponsiveManager, ResponsiveLayoutConfig } from '../src/cli/terminal/responsive';
import { CommandRegistry } from '../src/commands/command-registry';
import { CommandHistory } from '../src/commands/history';
import { loadAndValidateEnv, getEnv } from '../src/config/env';
import { stripAnsi } from '../src/cli/terminal/theme';
import { Application } from '../src/cli/app/application';

describe('Wattpad CLI — Reconstrucción UI y Gestión Literaria', () => {
  // 1. Dotenv Isolation & Configuration
  describe('Configuración y Aislamiento de Entorno', () => {
    it('should validate environment without leaking dotenv console noise', () => {
      expect(process.env.DOTENV_QUIET).toBe('true');
      const env = getEnv();
      expect(env).toBeDefined();
      expect(env.WATTPAD_API_BASE_URL).toContain('wattpad-cli.onrender.com');
      expect(env.NODE_ENV).toBeDefined();
    });

    it('should maintain cloud defaults when invoked from external directories', () => {
      const loaded = loadAndValidateEnv();
      expect(loaded.PUBLIC_APP_URL).toBe('https://wattpad-cli.onrender.com');
      expect(loaded.PORT).toBe(3000);
      expect(loaded.STORAGE_PROVIDER).toBe('s3');
    });
  });

  // 2. Workspace Navigation
  describe('Sistema de Navegación Lateral (WorkspaceNavigation)', () => {
    it('should initialize with Home and navigate through categories and items', () => {
      const nav = new WorkspaceNavigation('home');
      expect(nav.getSelectedItem().id).toBe('home');
      expect(nav.getSelectedIndex()).toBe(0);

      nav.navigateDown();
      expect(nav.getSelectedItem().id).toBe('stories');

      nav.navigateDown();
      expect(nav.getSelectedItem().id).toBe('new-story');

      nav.navigateUp();
      expect(nav.getSelectedItem().id).toBe('stories');
    });

    it('should contain all required categories and items', () => {
      const categories = new Set(NAV_ITEMS.map((i) => i.category));
      expect(categories.has('NOVELAS')).toBe(true);
      expect(categories.has('DOCUMENTOS')).toBe(true);
      expect(categories.has('PUBLICACIÓN')).toBe(true);
      expect(categories.has('CUENTA')).toBe(true);

      const ids = NAV_ITEMS.map((i) => i.id);
      expect(ids).toContain('home');
      expect(ids).toContain('stories');
      expect(ids).toContain('chapters');
      expect(ids).toContain('documents');
      expect(ids).toContain('word');
      expect(ids).toContain('notepad');
      expect(ids).toContain('google');
      expect(ids).toContain('sync');
      expect(ids).toContain('account');
      expect(ids).toContain('login');
      expect(ids).toContain('register');
      expect(ids).toContain('logout');
      expect(ids).toContain('help');
    });

    it('should render distinct indicator for active item', () => {
      const nav = new WorkspaceNavigation('stories');
      const lines = nav.render(24, 20, true);
      const renderedText = lines.join('\n');
      expect(renderedText).toContain('›');
      expect(renderedText).toContain('Mis novelas');
    });
  });

  // 3. Responsive Breakpoints & Multi-Column Layout
  describe('Diseño Responsive y Breakpoints Reales', () => {
    it('should adapt to Compact (< 70 cols) with single column and compact header', () => {
      const config = ResponsiveManager.getLayoutConfig(60, 20);
      expect(config.breakpoint).toBe('COMPACT');
      expect(config.isCompact).toBe(true);
      expect(config.showSecondaryPanels).toBe(false);
      expect(config.sidebarWidth).toBe(0);
      expect(config.mainWidth).toBe(60);
    });

    it('should adapt to Standard (70-99 cols) with clean single column', () => {
      const config = ResponsiveManager.getLayoutConfig(85, 25);
      expect(config.breakpoint).toBe('STANDARD');
      expect(config.isCompact).toBe(false);
      expect(config.sidebarWidth).toBe(0);
      expect(config.mainWidth).toBe(85);
    });

    it('should adapt to Wide (>= 100 cols) with side panels enabled', () => {
      const config = ResponsiveManager.getLayoutConfig(120, 30);
      expect(config.breakpoint).toBe('WIDE');
      expect(config.showSecondaryPanels).toBe(true);
      expect(config.sidebarWidth).toBe(24);
      expect(config.mainWidth).toBe(93);
    });
  });

  // 4. Core Terminal UI Components
  describe('Componentes TUI de Wattpad CLI', () => {
    it('should render Header with Wattpad CLI identity and server status', () => {
      const config: ResponsiveLayoutConfig = {
        width: 80,
        height: 24,
        breakpoint: 'STANDARD',
        isCompact: false,
        sidebarWidth: 0,
        contextWidth: 0,
        mainWidth: 80,
        compactHeader: false,
        compactStatusBar: false,
        showSecondaryPanels: false,
      };

      const lines = Header.render(
        {
          version: '1.0.0',
          user: 'test_author',
          isAuthenticated: true,
          serverUrl: 'https://wattpad-cli.onrender.com',
          serverOnline: true,
        },
        config
      );

      const text = lines.join('\n');
      expect(text).toContain('WATTPAD CLI');
      expect(text).toContain('Cloud Postgres: Conectado');
      expect(text).toContain('@test_author');
    });

    it('should render CommandInput with cursor and prompt marker', () => {
      const lines = CommandInput.render('/story new "Mi Novela"', 10, 80, true);
      const text = lines.join('\n');
      expect(text).toContain('›');
      expect(text).toContain('/story new');
    });

    it('should render SuggestionsDropdown matching prefix', () => {
      const suggestions = [
        { command: '/story new', description: 'Crear nueva novela', category: 'Novelas' },
        { command: '/story open', description: 'Abrir novela', category: 'Novelas' },
      ];
      const lines = SuggestionsDropdown.render(suggestions, 0, 80);
      const text = lines.join('\n');
      expect(text).toContain('/story new');
      expect(text).toContain('Crear nueva novela');
      expect(text).toContain('›');
    });

    it('should render StatusBar with quick keybindings', () => {
      const config = ResponsiveManager.getLayoutConfig(80, 24);
      const lines = StatusBar.render(config);
      const text = lines.join('\n');
      expect(text).toContain('Navegar');
      expect(text).toContain('Enter');
      expect(text).toContain('Esc');
      expect(text).toContain('Comandos');
    });

    it('should render EmptyState with clear guidance', () => {
      const lines = EmptyState.render('Sin novelas', 'No hay historias creadas', '/story new para comenzar', 80);
      const text = lines.join('\n');
      expect(text).toContain('Sin novelas');
      expect(text).toContain('No hay historias creadas');
      expect(text).toContain('/story new para comenzar');
    });

    it('should render HomeView with novel list and quick actions', () => {
      const stories = [
        {
          id: 'NOV-0001',
          userId: 'usr_01',
          wattpadId: null,
          title: 'El Secreto de las Sombras',
          description: 'Misterio en la ciudad',
          coverUrl: null,
          genre: 'Misterio',
          category: 'Novela',
          tags: ['misterio'],
          language: 'es',
          mature: false,
          editorPreference: 'word' as const,
          status: 'draft' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const lines = HomeView.render(
        {
          stories,
          chaptersCountByStoryId: { 'NOV-0001': 2 },
          selectedIndex: 0,
          user: 'wattpad_author',
          isAuthenticated: true,
        },
        80
      );

      const text = lines.join('\n');
      expect(text).toContain('Wattpad CLI');
      expect(text).toContain('ACCIONES RÁPIDAS');
      expect(text).toContain('El Secreto de las Sombras');
    });

    it('should render DocumentsView with hierarchical novel structure', () => {
      const stories = [
        {
          id: 'NOV-0001',
          userId: 'usr_01',
          wattpadId: null,
          title: 'El Secreto de las Sombras',
          description: '',
          coverUrl: null,
          genre: 'Misterio',
          category: 'Novela',
          tags: [],
          language: 'es',
          mature: false,
          editorPreference: 'word' as const,
          status: 'draft' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      const chapters = [
        {
          id: 'CAP-0001',
          storyId: 'NOV-0001',
          wattpadId: null,
          title: 'El Despertar',
          chapterNumber: 1,
          content: 'Texto de prueba',
          contentHash: 'hash1',
          wordCount: 150,
          status: 'draft' as const,
          externalDocId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const lines = DocumentsView.render({ stories, chapters, wordConnected: true, notepadConnected: true }, 80);
      const text = lines.join('\n');
      expect(text).toContain('Centro de Documentos');
      expect(text).toContain('Mis novelas/');
      expect(text).toContain('El Secreto de las Sombras');
      expect(text).toContain('Capitulos/');
      expect(text).toContain('Capitulo_01_El_Despertar.docx');
    });

    it('should render CommandOutputView with execution status and fields', () => {
      const lines = CommandOutputView.render(
        {
          command: '/story info NOV-0001',
          result: {
            success: true,
            message: 'Información de la novela',
            blocks: [
              {
                type: 'card',
                title: 'Detalles',
                fields: [{ label: 'Título', value: 'El Secreto' }],
              },
            ],
          },
        },
        80
      );
      const text = lines.join('\n');
      expect(text).toContain('/story info NOV-0001');
      expect(text).toContain('ÉXITO');
      expect(text).toContain('Detalles');
      expect(text).toContain('El Secreto');
    });

    it('should render ProjectContext for wide workspaces', () => {
      const lines = ProjectContext.render(
        {
          activeStoryTitle: 'El Secreto de las Sombras',
          activeStoryId: 'NOV-0001',
          activeChapterTitle: 'Capítulo 1: El Despertar',
          activeChapterId: 'CAP-0001',
          wordCount: 1540,
          editorPreference: 'word',
          syncState: 'Al día',
        },
        30,
        20
      );
      const text = lines.join('\n');
      expect(text).toContain('NOVELA Y CAPÍTULO ACTIVO');
      expect(text).toContain('El Secreto de las Sombras');
      expect(text).toContain('1540 palabras');
      expect(text).toContain('WORD');
    });
  });

  // 5. AppShell Coordinator Lifecycle & Non-Interactive Commands
  describe('AppShell y Ejecución de Comandos', () => {
    it('should initialize Application and execute non-interactive commands directly', async () => {
      const app = new Application();
      await app.init();

      const versionRes = await app.executeCommand('/version');
      expect(versionRes.success).toBe(true);
      expect(versionRes.blocks).toBeDefined();

      const helpRes = await app.executeCommand('/help');
      expect(helpRes.success).toBe(true);

      const statusRes = await app.executeCommand('/status');
      expect(statusRes.success).toBe(true);
    });

    it('should switch views properly in AppShell', () => {
      const reg = new CommandRegistry();
      const hist = new CommandHistory();
      const shell = new AppShell(reg, hist);

      shell.switchView('library');
      shell.switchView('chapters');
      shell.switchView('documents');
      shell.switchView('home');
      // No crashes
      expect(shell).toBeDefined();
    });
  });
});
