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
import { AIModelsView, AI_MODELS } from '../src/cli/terminal/views/models-view';
import { ConversationView } from '../src/cli/terminal/views/conversation-view';
import { ResponsiveManager, ResponsiveLayoutConfig } from '../src/cli/terminal/responsive';
import { CommandRegistry } from '../src/commands/command-registry';
import { CommandHistory } from '../src/commands/history';
import { loadAndValidateEnv, getEnv } from '../src/config/env';
import { stripAnsi } from '../src/cli/terminal/theme';
import { Application } from '../src/cli/app/application';

describe('Wattpad CLI — AI Writing Studio & Nuevo Arranque', () => {
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
      expect(nav.getSelectedItem().id).toBe('library');

      nav.navigateDown();
      expect(nav.getSelectedItem().id).toBe('stories');

      nav.navigateUp();
      expect(nav.getSelectedItem().id).toBe('library');
    });

    it('should contain all required categories and items', () => {
      const categories = new Set(NAV_ITEMS.map((i) => i.category));
      expect(categories.has('WORKSPACE')).toBe(true);
      expect(categories.has('INTELIGENCIA ARTIFICIAL')).toBe(true);
      expect(categories.has('INTEGRACIONES')).toBe(true);
      expect(categories.has('CUENTA')).toBe(true);

      const ids = NAV_ITEMS.map((i) => i.id);
      expect(ids).toContain('home');
      expect(ids).toContain('library');
      expect(ids).toContain('stories');
      expect(ids).toContain('chapters');
      expect(ids).toContain('models');
      expect(ids).toContain('word');
      expect(ids).toContain('notepad');
      expect(ids).toContain('google');
      expect(ids).toContain('sync');
      expect(ids).toContain('profile');
      expect(ids).toContain('settings');
      expect(ids).toContain('help');
    });

    it('should render distinct indicator for active item', () => {
      const nav = new WorkspaceNavigation('library');
      const lines = nav.render(24, 20, true);
      const renderedText = lines.join('\n');
      expect(renderedText).toContain('›');
      expect(renderedText).toContain('Biblioteca');
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
      const config = ResponsiveManager.getLayoutConfig(80, 24);
      expect(config.breakpoint).toBe('STANDARD');
      expect(config.showSecondaryPanels).toBe(false);
      expect(config.sidebarWidth).toBe(0);
      expect(config.mainWidth).toBe(80);
    });

    it('should adapt to Wide (100-139 cols) with sidebar navigation + main workspace', () => {
      const config = ResponsiveManager.getLayoutConfig(120, 35);
      expect(config.breakpoint).toBe('WIDE');
      expect(config.showSecondaryPanels).toBe(true);
      expect(config.sidebarWidth).toBe(24);
      expect(config.mainWidth).toBeGreaterThan(60);
    });

    it('should adapt to Ultra-Wide (>= 140 cols) with sidebar + main workspace + project context panel', () => {
      const config = ResponsiveManager.getLayoutConfig(160, 45);
      expect(config.breakpoint).toBe('ULTRA_WIDE');
      expect(config.showSecondaryPanels).toBe(true);
      expect(config.sidebarWidth).toBe(24);
      expect(config.contextWidth).toBe(32);
      expect(config.mainWidth).toBeGreaterThan(80);
    });
  });

  // 4. Studio Components & Views
  describe('Componentes del AI Writing Studio', () => {
    it('should render minimalist Header with cloud status and user badge', () => {
      const config = ResponsiveManager.getLayoutConfig(100, 30);
      const headerLines = Header.render(
        {
          version: '1.0.0',
          user: 'wattpad_author',
          isAuthenticated: true,
          serverUrl: 'https://wattpad-cli.onrender.com',
          serverOnline: true,
          activeStory: 'El Secreto de las Sombras',
        },
        config
      );
      const rendered = headerLines.join('\n');
      expect(rendered).toContain('WATTPAD');
      expect(rendered).toContain('AI Writing Studio');
      expect(rendered).toContain('@wattpad_author');
      expect(rendered).toContain('Cloud: Conectado');
    });

    it('should render CommandInput with prompt indicator and cursor', () => {
      const lines = CommandInput.render('/story new', 10, 80, true);
      const text = lines.join('\n');
      expect(text).toContain('›');
      expect(text).toContain('/story new');
    });

    it('should render SuggestionsDropdown with matched commands', () => {
      const suggestions = [
        { command: '/stories', description: 'Listar novelas', category: 'Novelas' },
        { command: '/story', description: 'Gestión de historias', category: 'Novelas' },
      ];
      const lines = SuggestionsDropdown.render(suggestions, 0, 80);
      const text = lines.join('\n');
      expect(text).toContain('›');
      expect(text).toContain('/stories');
      expect(text).toContain('/story');
    });

    it('should render StatusBar with interactive shortcuts', () => {
      const config = ResponsiveManager.getLayoutConfig(90, 25);
      const lines = StatusBar.render(config);
      const text = lines.join('\n');
      expect(text).toContain('↑↓');
      expect(text).toContain('Enter');
      expect(text).toContain('Esc');
      expect(text).toContain('Ctrl+C');
    });

    it('should render States (LoadingState, EmptyState, ErrorState)', () => {
      const loading = LoadingState.render('Conectando...', 80).join('\n');
      expect(loading).toContain('Conectando...');

      const empty = EmptyState.render('Sin novelas', 'Crea una novela', '/story new', 80).join('\n');
      expect(empty).toContain('Sin novelas');
      expect(empty).toContain('/story new');

      const error = ErrorState.render('Fallo en sincronización', 80).join('\n');
      expect(error).toContain('Fallo en sincronización');
    });

    it('should render HomeView with creative greeting, actions and recent stories', () => {
      const stories = [
        {
          id: 'NOV-0001',
          userId: 'usr_01',
          wattpadId: null,
          title: 'El Secreto de las Sombras',
          description: 'Misterio literario',
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
        },
        80
      );

      const text = lines.join('\n');
      expect(text).toContain('¿Qué vamos a escribir hoy?');
      expect(text).toContain('Tu espacio de trabajo creativo');
      expect(text).toContain('ACCIONES RÁPIDAS');
      expect(text).toContain('El Secreto de las Sombras');
    });

    it('should render AIModelsView with official narrative models', () => {
      const lines = AIModelsView.render(0, 80);
      const text = lines.join('\n');
      expect(text).toContain('Modelos de Asistencia Narrativa IA');
      expect(text).toContain('wattpad-writer-pro-v2');
      expect(text).toContain('wattpad-dialogue-turbo');
      expect(text).toContain('claude-3-5-sonnet');
      expect(text).toContain('gemini-1-5-pro');
    });

    it('should render ConversationView with user and assistant messages', () => {
      const messages = [
        { id: '1', sender: 'user' as const, content: 'Escribe el prólogo de una novela de fantasía', timestamp: new Date().toISOString() },
        { id: '2', sender: 'assistant' as const, content: 'La bruma descendía sobre los picos de Eldoria...', timestamp: new Date().toISOString() },
      ];
      const lines = ConversationView.render(messages, false, 80);
      const text = lines.join('\n');
      expect(stripAnsi(text)).toContain('› Escribe el prólogo');
      expect(text).toContain('Wattpad Assistant');
      expect(text).toContain('La bruma descendía');
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
      expect(text).toContain('CONTEXTO CREATIVO');
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
      shell.switchView('models');
      shell.switchView('home');
      // No crashes
      expect(shell).toBeDefined();
    });
  });
});
