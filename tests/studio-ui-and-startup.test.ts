import { describe, expect, it } from 'bun:test';
import { AppShell } from '../src/cli/terminal/app-shell';
import { Header } from '../src/cli/terminal/components/header';
import { CommandInput } from '../src/cli/terminal/components/command-input';
import { SuggestionsDropdown } from '../src/cli/terminal/components/suggestions';
import { StatusBar } from '../src/cli/terminal/components/status-bar';
import { CommandOutput } from '../src/cli/terminal/components/command-output';
import { ResponsiveManager, ResponsiveLayoutConfig } from '../src/cli/terminal/responsive';
import { CommandRegistry } from '../src/commands/command-registry';
import { CommandHistory } from '../src/commands/history';
import { loadAndValidateEnv, getEnv } from '../src/config/env';
import { Application } from '../src/cli/app/application';

describe('Wattpad CLI — Componentes TUI y Ejecución Oficial v1.0.0', () => {
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
    });
  });

  // 2. Responsive Breakpoints
  describe('Diseño Responsive y Breakpoints Reales', () => {
    it('should adapt to Compact (< 70 cols) with single column layout', () => {
      const config = ResponsiveManager.getLayoutConfig(60, 20);
      expect(config.breakpoint).toBe('COMPACT');
      expect(config.isCompact).toBe(true);
      expect(config.mainWidth).toBe(60);
    });

    it('should adapt to Standard (70-99 cols) with clean single column', () => {
      const config = ResponsiveManager.getLayoutConfig(85, 25);
      expect(config.breakpoint).toBe('STANDARD');
      expect(config.isCompact).toBe(false);
      expect(config.mainWidth).toBe(85);
    });

    it('should adapt to Wide (>= 100 cols) cleanly', () => {
      const config = ResponsiveManager.getLayoutConfig(120, 30);
      expect(config.breakpoint).toBe('WIDE');
      expect(config.width).toBe(120);
    });
  });

  // 3. Core Terminal UI Components
  describe('Componentes TUI de Wattpad CLI', () => {
    it('should render Header with Wattpad CLI identity and version 1.0.0', () => {
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
      expect(text).toContain('v1.0.0');
      expect(text).toContain('@test_author');
      expect(text).toContain('Wattpad conectado');
      expect(text).toContain('◉');
    });

    it('should render CommandInput with cursor and prompt marker', () => {
      const lines = CommandInput.render('/story new "Mi Novela"', 10, 80, true);
      const text = lines.join('\n');
      expect(text).toMatch(/[›❯]/);
      expect(text).toContain('/story new');
      expect(text).toContain('Wattpad CLI');
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

    it('should render StatusBar with minimalist bottom line and exact keybindings', () => {
      const config = ResponsiveManager.getLayoutConfig(80, 24);
      const lines = StatusBar.render(config);
      const text = lines.join('\n');
      expect(text).toContain('Historial');
      expect(text).toContain('Ejecutar');
      expect(text).toContain('Autocompletar');
      expect(text).toContain('Comandos');
      expect(text).toContain('Salir');
    });

    it('should adapt StatusBar cleanly on narrow terminal widths', () => {
      const config = ResponsiveManager.getLayoutConfig(50, 20);
      const lines = StatusBar.render(config);
      const text = lines.join('\n');
      expect(text).toContain('Historial');
      expect(text).toContain('Completar');
      expect(text).toContain('Salir');
    });

    it('should render CommandOutput with execution status, badges and fields', () => {
      const lines = CommandOutput.render(
        {
          command: '/story info NOV-0001',
          result: {
            success: true,
            message: 'Información de la novela',
            blocks: [
              {
                type: 'card',
                title: 'Detalles de la Novela',
                fields: [{ label: 'Título', value: 'La Corona de Espinas' }],
              },
            ],
          },
        },
        80
      );
      const text = lines.join('\n');
      expect(text).toContain('/story info NOV-0001');
      expect(text).toContain('ÉXITO');
      expect(text).toContain('Detalles de la Novela');
      expect(text).toContain('La Corona de Espinas');
    });
  });

  // 4. AppShell Lifecycle & Non-Interactive Execution
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

    it('should switch view without throwing in AppShell', () => {
      const reg = new CommandRegistry();
      const hist = new CommandHistory();
      const shell = new AppShell(reg, hist);

      shell.switchView('output');
      shell.switchView();
      expect(shell).toBeDefined();
    });
  });
});
