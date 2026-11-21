import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { Header } from '../src/platform/terminal/components/header';
import { HomeView } from '../src/platform/terminal/components/home-view';
import { SuggestionsDropdown } from '../src/platform/terminal/components/suggestions';
import { StatusBar } from '../src/platform/terminal/components/status-bar';
import { CommandInput } from '../src/platform/terminal/components/command-input';
import { ResponsiveManager } from '../src/platform/terminal/responsive';
import { stripAnsi } from '../src/platform/terminal/theme';
import { APP_VERSION } from '../src/core/config/config';
import { AppShell } from '../src/platform/terminal/app-shell';
import { CommandRegistry } from '../src/features/commands/command-registry';
import { CommandHistory } from '../src/features/commands/history';

describe('WATTPAD CLI v1.0.1 — Rediseño Minimalista, Autocompletado, Scroll y Barra Única', () => {
  const config = ResponsiveManager.getLayoutConfig(80, 24);

  // =========================================================================
  // 1. VERSIÓN Y LOGOTIPO ASCII DE 3 LÍNEAS
  // =========================================================================
  describe('1. Identidad de Versión v1.0.1 y Logotipo ASCII', () => {
    it('debe utilizar estrictamente v1.0.1 como versión de producto', () => {
      expect(APP_VERSION).toBe('1.0.1');
    });

    it('el encabezado debe renderizar el logotipo ASCII de 3 líneas oficial', () => {
      const lines = Header.render(
        {
          version: APP_VERSION,
          user: 'AnMigz',
          isAuthenticated: true,
          mode: 'completa',
        },
        config
      );

      const text = stripAnsi(lines.join('\n'));
      expect(text).toContain('██╗    ██╗');
      expect(text).toContain('██║ █╗ ██║');
      expect(text).toContain('╚███╔███╔╝');
      expect(text).toContain('WATTPAD CLI v1.0.1');
      expect(text).toContain('@AnMigz');
      expect(text).toContain('Conectado');
      expect(text).toContain('~/Documents/Wattpad/Novelas');
    });

    it('el encabezado debe adaptarse a modo desconectado manteniendo el logo de 3 líneas', () => {
      const lines = Header.render(
        {
          version: APP_VERSION,
          user: null,
          isAuthenticated: false,
          mode: 'completa',
        },
        config
      );

      const text = stripAnsi(lines.join('\n'));
      expect(text).toContain('██╗    ██╗');
      expect(text).toContain('Sin conexión');
    });
  });

  // =========================================================================
  // 2. PANTALLA DE INICIO MINIMALISTA
  // =========================================================================
  describe('2. Pantalla de Inicio Minimalista', () => {
    it('debe renderizar el saludo limpio y espacioso sin tablas pesadas en el arranque', () => {
      const lines = HomeView.render({
        user: null,
        isAuthenticated: false,
        stories: [],
        chapters: [],
        recentCommands: [],
        width: 80,
      });

      const text = stripAnsi(lines.join('\n'));
      expect(text).toContain('Bienvenido a Wattpad CLI.');
      expect(text).toContain('Gestiona tus novelas, capítulos y manuscritos.');
      expect(text).toContain('Escribe /help para consultar los comandos disponibles.');

      // No debe contener tablas gigantes ni marcos saturados al arrancar
      expect(text).not.toContain('╭──────────────────────────────────────────────────────────');
      expect(text).not.toContain('Novelas publicadas:    0 obra(s)');
    });
  });

  // =========================================================================
  // 3. AUTOCOMPLETADO AL ESCRIBIR "/" Y FILTRADO EN TIEMPO REAL
  // =========================================================================
  describe('3. Autocompletado Contextual al escribir "/"', () => {
    it('debe renderizar sugerencias con prefijo distintivo › en el comando activo', () => {
      const sampleSuggestions = [
        { command: '/stories', description: 'Consultar mis novelas', category: 'stories' as any },
        { command: '/profile', description: 'Ver mi perfil', category: 'profile' as any },
        { command: '/discover', description: 'Buscar novelas', category: 'discovery' as any },
        { command: '/chapter', description: 'Gestionar capítulos', category: 'chapters' as any },
      ];

      const lines = SuggestionsDropdown.render(sampleSuggestions, 0, 80);
      const text = stripAnsi(lines.join('\n'));

      expect(text).toContain('›');
      expect(text).toContain('/stories');
      expect(text).toContain('Consultar mis novelas');
      expect(text).toContain('/profile');
      expect(text).toContain('Ver mi perfil');
      expect(text).toContain('↑↓ Navegar');
      expect(text).toContain('Tab Completar');
      expect(text).toContain('Enter Ejecutar');
      expect(text).toContain('Esc Cerrar');
    });

    it('debe mantener visible la sugerencia seleccionada mediante ventana deslizante', () => {
      const manySuggestions = Array.from({ length: 15 }, (_, i) => ({
        command: `/cmd${i}`,
        description: `Descripción ${i}`,
        category: 'general' as any,
      }));

      // Seleccionar el elemento 10 (fuera de la primera página de 8)
      const lines = SuggestionsDropdown.render(manySuggestions, 10, 80);
      const text = stripAnsi(lines.join('\n'));

      expect(text).toContain('/cmd10');
      expect(text).toContain('›');
    });
  });

  // =========================================================================
  // 4. BARRA DE ESTADO ÚNICA Y ELIMINACIÓN DE DUPLICADOS
  // =========================================================================
  describe('4. Barra de Estado Única y Contextual', () => {
    it('debe renderizar atajos contextuales para el menú de sugerencias', () => {
      const lines = StatusBar.render(config, {
        activeContext: 'suggestions',
        mode: 'completa',
        isAuthenticated: true,
        user: 'AnMigz',
      });

      const text = stripAnsi(lines.join('\n'));
      expect(text).toContain('Navegar sugerencias');
      expect(text).toContain('Ejecutar');
      expect(text).toContain('Completar');
      expect(text).toContain('Cerrar');
      expect(text).toContain('@AnMigz');
      expect(text).toContain('[Modo: Completa]');
    });

    it('debe renderizar atajos contextuales para el modo editor', () => {
      const lines = StatusBar.render(config, {
        activeContext: 'editor',
        mode: 'completa',
        isAuthenticated: false,
      });

      const text = stripAnsi(lines.join('\n'));
      expect(text).toContain('Ctrl+S Guardar');
      expect(text).toContain('Ctrl+F Buscar');
      expect(text).toContain('Esc Salir');
      expect(text).toContain('Sin conexión');
    });

    it('debe renderizar atajos contextuales para el selector interactivo', () => {
      const lines = StatusBar.render(config, {
        activeContext: 'selector',
        mode: 'compacta',
      });

      const text = stripAnsi(lines.join('\n'));
      expect(text).toContain('Seleccionar');
      expect(text).toContain('Paneles');
      expect(text).toContain('Acciones');
      expect(text).toContain('Volver');
      expect(text).toContain('[Modo: Compacta]');
    });

    it('debe mostrar notificaciones temporales prominentes en la barra de estado', () => {
      const lines = StatusBar.render(config, {
        notification: '✓ Novela guardada exitosamente',
        mode: 'completa',
      });

      const text = stripAnsi(lines.join('\n'));
      expect(text).toContain('✓ Novela guardada exitosamente');
      expect(text).toContain('[Modo: Completa]');
    });

    it('CommandInput con showFooter=false no debe duplicar la barra de estado', () => {
      const lines = CommandInput.render('/stories', 8, 80, true, false);
      const text = stripAnsi(lines.join('\n'));

      expect(text).toContain('❯');
      expect(text).toContain('/stories');
      // No debe contener la barra de atajos duplicada al pie de la caja
      expect(text).not.toContain('? Ayuda · / Comandos · ↑↓ Historial');
    });
  });

  // =========================================================================
  // 5. MOTOR DE DESPLAZAMIENTO (SCROLL) Y COEXISTENCIA DE TECLADO EN APPSHELL
  // =========================================================================
  describe('5. Motor de Scroll y Prioridad de Eventos de Teclado en AppShell', () => {
    let registry: CommandRegistry;
    let history: CommandHistory;
    let shell: AppShell;

    beforeEach(() => {
      registry = new CommandRegistry();
      history = new CommandHistory();
      shell = new AppShell(registry, history);
    });

    it('debe abrir sugerencias inmediatamente al escribir "/"', () => {
      registry.register({
        name: '/stories',
        description: 'Consultar mis novelas',
        descriptionEn: 'View my stories',
        usage: '/stories',
        examples: ['/stories'],
        category: 'stories',
        execute: () => ({ success: true }),
      });
      registry.register({
        name: '/story',
        description: 'Gestionar una novela',
        descriptionEn: 'Manage a story',
        usage: '/story <id>',
        examples: ['/story open NOV-1'],
        minArgs: 1,
        category: 'stories',
        execute: () => ({ success: true }),
      });

      // Escribir '/'
      shell.handleKeyPress('/', { name: undefined } as any);
      const state = (shell as any);
      expect(state.inputValue).toBe('/');
      expect(state.suggestions.length).toBeGreaterThanOrEqual(2);
      expect(state.suggestions[0].command).toBe('/stories');
    });

    it('debe filtrar en tiempo real al escribir "/st"', () => {
      registry.register({
        name: '/stories',
        description: 'Consultar mis novelas',
        descriptionEn: 'View my stories',
        usage: '/stories',
        examples: ['/stories'],
        category: 'stories',
        execute: () => ({ success: true }),
      });
      registry.register({
        name: '/help',
        description: 'Centro de ayuda',
        descriptionEn: 'Help center',
        usage: '/help',
        examples: ['/help'],
        category: 'general',
        execute: () => ({ success: true }),
      });

      shell.handleKeyPress('/', { name: undefined } as any);
      shell.handleKeyPress('s', { name: undefined } as any);
      shell.handleKeyPress('t', { name: undefined } as any);

      const state = (shell as any);
      expect(state.inputValue).toBe('/st');
      expect(state.suggestions.every((s: any) => s.command.startsWith('/st'))).toBe(true);
      expect(state.suggestions.some((s: any) => s.command === '/help')).toBe(false);
    });

    it('debe navegar sugerencias con flechas arriba y abajo', () => {
      registry.register({
        name: '/stories',
        description: 'Consultar mis novelas',
        descriptionEn: 'View my stories',
        usage: '/stories',
        examples: ['/stories'],
        category: 'stories',
        execute: () => ({ success: true }),
      });
      registry.register({
        name: '/story',
        description: 'Gestionar una novela',
        descriptionEn: 'Manage a story',
        usage: '/story <id>',
        examples: ['/story open NOV-1'],
        category: 'stories',
        execute: () => ({ success: true }),
      });

      shell.handleKeyPress('/', { name: undefined } as any);
      const state = (shell as any);
      expect(state.selectedSuggestionIndex).toBe(0);

      // Flecha abajo navega al siguiente
      shell.handleKeyPress('', { name: 'down' } as any);
      expect(state.selectedSuggestionIndex).toBe(1);

      // Flecha arriba vuelve al anterior
      shell.handleKeyPress('', { name: 'up' } as any);
      expect(state.selectedSuggestionIndex).toBe(0);
    });

    it('debe autocompletar la sugerencia seleccionada con Tab', () => {
      registry.register({
        name: '/stories',
        description: 'Consultar mis novelas',
        descriptionEn: 'View my stories',
        usage: '/stories',
        examples: ['/stories'],
        category: 'stories',
        execute: () => ({ success: true }),
      });

      shell.handleKeyPress('/', { name: undefined } as any);
      shell.handleKeyPress('', { name: 'tab' } as any);

      const state = (shell as any);
      expect(state.inputValue).toBe('/stories ');
      expect(state.suggestions.length).toBe(0);
    });

    it('debe cerrar las sugerencias al pulsar Escape', () => {
      registry.register({
        name: '/stories',
        description: 'Consultar mis novelas',
        descriptionEn: 'View my stories',
        usage: '/stories',
        examples: ['/stories'],
        category: 'stories',
        execute: () => ({ success: true }),
      });

      shell.handleKeyPress('/', { name: undefined } as any);
      const state = (shell as any);
      expect(state.suggestions.length).toBeGreaterThan(0);

      shell.handleKeyPress('', { name: 'escape' } as any);
      expect(state.suggestions.length).toBe(0);
    });

    it('Shift+Up y Shift+Down deben desplazar la vista sin alterar el historial', () => {
      history.push('/stories');
      history.push('/profile');

      const state = (shell as any);
      // Simular salida larga de 60 líneas para permitir scroll
      state.latestOutput = {
        command: '/stories',
        result: {
          success: true,
          message: Array.from({ length: 60 }, (_, i) => `Novela ${i}: Capítulo y detalles`).join('\n'),
        },
      };
      state.scrollOffset = 10;

      // Shift+Up desplaza vista hacia arriba 1 línea
      shell.handleKeyPress('', { shift: true, name: 'up' } as any);
      expect(state.scrollOffset).toBe(9);
      expect(state.inputValue).toBe(''); // no altera input ni historial

      // Shift+Down desplaza vista hacia abajo 1 línea
      shell.handleKeyPress('', { shift: true, name: 'down' } as any);
      expect(state.scrollOffset).toBe(10);
      expect(state.inputValue).toBe('');
    });

    it('PageUp y PageDown deben desplazar por páginas', () => {
      const state = (shell as any);
      state.latestOutput = {
        command: '/stories',
        result: {
          success: true,
          message: Array.from({ length: 60 }, (_, i) => `Novela ${i}: Capítulo y detalles`).join('\n'),
        },
      };
      state.scrollOffset = 20;

      shell.handleKeyPress('', { name: 'pageup' } as any);
      expect(state.scrollOffset).toBe(10);

      shell.handleKeyPress('', { name: 'pagedown' } as any);
      expect(state.scrollOffset).toBe(20);
    });

    it('Ctrl+Home y Ctrl+End deben llevar al inicio y al final de la vista', () => {
      const state = (shell as any);
      state.latestOutput = {
        command: '/stories',
        result: {
          success: true,
          message: Array.from({ length: 60 }, (_, i) => `Novela ${i}: Capítulo y detalles`).join('\n'),
        },
      };
      state.scrollOffset = 25;

      shell.handleKeyPress('', { ctrl: true, name: 'home' } as any);
      expect(state.scrollOffset).toBe(0);

      shell.handleKeyPress('', { ctrl: true, name: 'end' } as any);
      expect(state.scrollOffset).toBeGreaterThan(0);
    });

    it('al ejecutar un nuevo comando el scroll debe reiniciarse a 0', async () => {
      const state = (shell as any);
      state.scrollOffset = 45;

      // Ejecutar un comando como /clear
      shell.handleKeyPress('/', { name: undefined } as any);
      shell.handleKeyPress('c', { name: undefined } as any);
      shell.handleKeyPress('l', { name: undefined } as any);
      shell.handleKeyPress('e', { name: undefined } as any);
      shell.handleKeyPress('a', { name: undefined } as any);
      shell.handleKeyPress('r', { name: undefined } as any);
      shell.handleKeyPress('', { name: 'return' } as any);

      expect(state.scrollOffset).toBe(0);
    });
  });
});
