import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { SettingsManager } from '../src/core/config/settings-manager';
import {
  InteractiveSettingsView,
  InteractiveMenuView,
  InteractiveProfileView,
  InteractiveCatalogView,
  InteractiveChapterView,
  InteractiveImportView,
  InteractiveDialogView,
} from '../src/platform/terminal/interactive';
import { CommandRegistry } from '../src/features/commands/command-registry';
import { CommandHistory } from '../src/features/commands/history';
import { AppShell } from '../src/platform/terminal/app-shell';
import { stripAnsi } from '../src/platform/terminal/theme';
import { APP_VERSION } from '../src/core/config/config';

describe('WATTPAD CLI v1.0.1 — Motor de Comandos Interactivos con 4 Flechas', () => {
  const tempDir = path.resolve(process.cwd(), 'tests', 'temp_interactive');
  const tempSettingsPath = path.join(tempDir, 'settings.json');
  let settingsManager: SettingsManager;

  beforeEach(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    settingsManager = new SettingsManager(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // 1. Comando Estrella: /config y Panel Interactivo de Configuración
  describe('Comando Estrella: /config y Panel Interactivo', () => {
    it('debe inicializar la vista con todas las opciones y 9 categorías oficiales', () => {
      const view = new InteractiveSettingsView(settingsManager);
      expect(view.getId()).toBe('settings-config');
      expect(view.getTitle()).toContain('CONFIGURACIÓN');

      const defs = view.getFilteredDefinitions();
      expect(defs.length).toBeGreaterThanOrEqual(20);

      const categories = new Set(defs.map((d) => d.category));
      expect(categories.has('Appearance')).toBe(true);
      expect(categories.has('Terminal')).toBe(true);
      expect(categories.has('Commands')).toBe(true);
      expect(categories.has('Editor')).toBe(true);
      expect(categories.has('Documents')).toBe(true);
      expect(categories.has('Wattpad')).toBe(true);
      expect(categories.has('Google')).toBe(true);
      expect(categories.has('Security')).toBe(true);
      expect(categories.has('Updates')).toBe(true);
    });

    it('debe navegar con flechas arriba (↑) y abajo (↓) entre las opciones', () => {
      const view = new InteractiveSettingsView(settingsManager);
      const linesBefore = stripAnsi(view.render(80, 24).join('\n'));
      expect(linesBefore).toContain('›');

      // Bajar con ↓
      view.handleKeyPress('', { name: 'down' } as any);
      const linesAfterDown = stripAnsi(view.render(80, 24).join('\n'));
      expect(linesAfterDown).toContain('›');

      // Subir con ↑
      view.handleKeyPress('', { name: 'up' } as any);
      const linesAfterUp = stripAnsi(view.render(80, 24).join('\n'));
      expect(linesAfterUp).toContain('›');
    });

    it('debe cambiar valores booleanos y enum con flechas izquierda (←) y derecha (→)', () => {
      const view = new InteractiveSettingsView(settingsManager);
      // Primera opción: interface_mode ('complete' | 'compact' | 'zen')
      const initialMode = settingsManager.get('interface_mode');
      expect(initialMode).toBe('complete');

      // Flecha derecha → cambia valor a compact
      view.handleKeyPress('', { name: 'right' } as any);
      expect(settingsManager.get('interface_mode')).toBe('compact');

      // Flecha derecha → cambia valor a zen
      view.handleKeyPress('', { name: 'right' } as any);
      expect(settingsManager.get('interface_mode')).toBe('zen');

      // Flecha izquierda ← retrocede valor a compact
      view.handleKeyPress('', { name: 'left' } as any);
      expect(settingsManager.get('interface_mode')).toBe('compact');
    });

    it('debe filtrar opciones en tiempo real con el buscador (Search: ___)', () => {
      const view = new InteractiveSettingsView(settingsManager);

      // Escribir 'term'
      view.handleKeyPress('t', { name: 't' } as any);
      view.handleKeyPress('e', { name: 'e' } as any);
      view.handleKeyPress('r', { name: 'r' } as any);
      view.handleKeyPress('m', { name: 'm' } as any);

      const filtered = view.getFilteredDefinitions();
      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach((def) => {
        const matches =
          def.id.toLowerCase().includes('term') ||
          def.name.toLowerCase().includes('term') ||
          def.category.toLowerCase().includes('term') ||
          def.description.toLowerCase().includes('term');
        expect(matches).toBe(true);
      });

      // Borrar con backspace
      view.handleKeyPress('', { name: 'backspace' } as any);
      view.handleKeyPress('', { name: 'backspace' } as any);
      view.handleKeyPress('', { name: 'backspace' } as any);
      view.handleKeyPress('', { name: 'backspace' } as any);

      expect(view.getFilteredDefinitions().length).toBeGreaterThanOrEqual(20);
    });

    it('debe mostrar la caja de descripción inferior con explicación, opciones e impacto', () => {
      const view = new InteractiveSettingsView(settingsManager);
      const rendered = stripAnsi(view.render(80, 24).join('\n'));

      expect(rendered).toContain('Descripción:');
      expect(rendered).toContain('Valor actual:');
      expect(rendered).toContain('Opciones:');
      expect(rendered).toContain('Impacto:');
    });

    it('debe persistir los cambios inmediatamente en el archivo settings.json local', () => {
      const view = new InteractiveSettingsView(settingsManager);
      view.handleKeyPress('', { name: 'right' } as any); // interface_mode -> compact

      expect(fs.existsSync(tempSettingsPath)).toBe(true);
      const persisted = JSON.parse(fs.readFileSync(tempSettingsPath, 'utf8'));
      expect(persisted.interface_mode).toBe('compact');
    });

    it('debe cerrar la vista con Esc cuando el buscador está vacío', () => {
      const view = new InteractiveSettingsView(settingsManager);
      const res = view.handleKeyPress('', { name: 'escape' } as any);
      expect(res).toBe('pop');
    });
  });

  // 2. Vista Interactiva de Menú y /help
  describe('InteractiveMenuView y /help interactivo', () => {
    it('debe permitir navegar categorías con flechas izquierda y derecha', () => {
      const menu = new InteractiveMenuView({
        id: 'help-test',
        title: 'AYUDA DE COMANDOS',
        items: [
          { id: '1', label: '/story new', category: 'Novelas', description: 'Crear novela' },
          { id: '2', label: '/login', category: 'Cuenta', description: 'Iniciar sesión' },
        ],
        categories: ['Todos', 'Novelas', 'Cuenta'],
      });

      expect(menu.getStatusBarHint()).toContain('←/→ Cambiar categoría');

      menu.handleKeyPress('', { name: 'right' } as any);
      const rendered = stripAnsi(menu.render(80, 24).join('\n'));
      expect(rendered).toContain('Novelas');
    });

    it('debe abrir detalles de comando con Enter y volver con Esc', () => {
      const menu = new InteractiveMenuView({
        id: 'help-test',
        title: 'AYUDA',
        items: [
          { id: '1', label: '/story new', description: 'Crear nueva novela', details: ['Uso: /story new "Título"'] },
        ],
      });

      menu.handleKeyPress('', { name: 'return' } as any);
      let rendered = stripAnsi(menu.render(80, 24).join('\n'));
      expect(rendered).toContain('DETALLES: /story new');
      expect(rendered).toContain('Uso: /story new "Título"');

      menu.handleKeyPress('', { name: 'escape' } as any);
      rendered = stripAnsi(menu.render(80, 24).join('\n'));
      expect(rendered).not.toContain('DETALLES:');
    });
  });

  // 3. Vista Interactiva de Perfil (/profile)
  describe('InteractiveProfileView (/profile)', () => {
    it('debe contener las 6 secciones oficiales del perfil', () => {
      const view = new InteractiveProfileView({
        user: { username: 'AnMigz', name: 'Miguel Carlos Rojas', description: 'Autor oficial' } as any,
        storiesCount: 2,
        draftsCount: 1,
        manuscriptsCount: 3,
      });

      const rendered = stripAnsi(view.render(80, 24).join('\n'));
      expect(rendered).toContain('1. Mi Perfil');
      expect(rendered).toContain('2. Mis Estadísticas');
      expect(rendered).toContain('3. Mis Obras');
      expect(rendered).toContain('4. Mi Biblioteca');
      expect(rendered).toContain('5. Buzón de Notificaciones');
      expect(rendered).toContain('6. Actualizar Perfil');
    });

    it('debe navegar secciones con ↑/↓ y abrir detalles con Enter', () => {
      const view = new InteractiveProfileView({
        user: { username: 'AnMigz', name: 'Miguel Carlos Rojas' } as any,
        storiesCount: 2,
        draftsCount: 1,
        manuscriptsCount: 3,
      });

      view.handleKeyPress('', { name: 'down' } as any); // Mis Estadísticas
      view.handleKeyPress('', { name: 'return' } as any);

      const rendered = stripAnsi(view.render(80, 24).join('\n'));
      expect(rendered).toContain('SECCIÓN: 2. Mis Estadísticas');
      expect(rendered).toContain('Novelas en catálogo:');
    });
  });

  // 4. Catálogo Interactivo (/stories)
  describe('InteractiveCatalogView (/stories)', () => {
    it('debe alternar entre pestañas con flechas izquierda (←) y derecha (→)', () => {
      const view = new InteractiveCatalogView({
        publishedStories: [{ id: 'PUB-1', title: 'Novela Pública' } as any],
        draftStories: [{ id: 'DRF-1', title: 'Borrador Wattpad' } as any],
        localManuscripts: [{ detectedTitle: 'Manuscrito Word', format: 'docx' } as any],
      });

      let rendered = stripAnsi(view.render(80, 24).join('\n'));
      expect(rendered).toContain('[ Publicadas (1) ]');

      view.handleKeyPress('', { name: 'right' } as any);
      rendered = stripAnsi(view.render(80, 24).join('\n'));
      expect(rendered).toContain('[ Borradores (1) ]');

      view.handleKeyPress('', { name: 'right' } as any);
      rendered = stripAnsi(view.render(80, 24).join('\n'));
      expect(rendered).toContain('[ Manuscritos Locales (1) ]');
    });

    it('debe abrir menú contextual con Enter sobre la novela seleccionada', () => {
      let executedAction = '';
      const view = new InteractiveCatalogView({
        publishedStories: [{ id: 'PUB-1', title: 'Novela Épica' } as any],
        draftStories: [],
        localManuscripts: [],
        onAction: (actId) => {
          executedAction = actId;
        },
      });

      view.handleKeyPress('', { name: 'return' } as any);
      let rendered = stripAnsi(view.render(80, 24).join('\n'));
      expect(rendered).toContain('OPCIONES PARA: Novela Épica');
      expect(rendered).toContain('1. Abrir novela');
      expect(rendered).toContain('2. Editar información');
      expect(rendered).toContain('3. Ver capítulos');
      expect(rendered).toContain('4. Publicar / Actualizar');
      expect(rendered).toContain('5. Exportar a Word (.docx)');
      expect(rendered).toContain('6. Eliminar');

      // Confirmar primera acción (abrir)
      view.handleKeyPress('', { name: 'return' } as any);
      expect(executedAction).toBe('open');
    });
  });

  // 5. Selector y Menú de Capítulos (/chapter)
  describe('InteractiveChapterView (/chapter)', () => {
    it('debe listar capítulos numerados y abrir el submenú de 6 acciones con Enter', () => {
      let actionChosen = '';
      const view = new InteractiveChapterView({
        storyTitle: 'La Sombra del Rey',
        chapters: [
          { id: 'CAP-0001', chapterNumber: 1, title: 'El Despertar', wordCount: 1500, isDraft: false } as any,
          { id: 'CAP-0002', chapterNumber: 2, title: 'El Viaje', wordCount: 2200, isDraft: true } as any,
        ],
        onAction: (actId) => {
          actionChosen = actId;
        },
      });

      let rendered = stripAnsi(view.render(80, 24).join('\n'));
      expect(rendered).toContain('El Despertar');
      expect(rendered).toContain('El Viaje');

      // Abrir menú de acciones sobre el capítulo 1
      view.handleKeyPress('', { name: 'return' } as any);
      rendered = stripAnsi(view.render(80, 24).join('\n'));
      expect(rendered).toContain('OPCIONES PARA: El Despertar');
      expect(rendered).toContain('1. Abrir en editor de terminal');
      expect(rendered).toContain('2. Abrir en Bloc de Notas / Word');
      expect(rendered).toContain('3. Exportar');
      expect(rendered).toContain('4. Sincronizar con Wattpad');
      expect(rendered).toContain('5. Ver historial de versiones');
      expect(rendered).toContain('6. Eliminar capítulo');

      // Confirmar primera acción (editor)
      view.handleKeyPress('', { name: 'return' } as any);
      expect(actionChosen).toBe('editor');
    });
  });

  // 6. Asistente Guiado de Importación (/chapter import)
  describe('InteractiveImportView (/chapter import)', () => {
    it('debe avanzar a través de los 5 pasos interactivos', () => {
      let confirmed = false;
      const view = new InteractiveImportView({
        stories: [{ id: 'NOV-0001', title: 'Mi Novela Fantástica' } as any],
        onConfirmImport: () => {
          confirmed = true;
        },
      });

      // Paso 1: Origen
      let rendered = stripAnsi(view.render(80, 24).join('\n'));
      expect(rendered).toContain('PASO 1 DE 5');
      expect(rendered).toContain('Microsoft Word (.docx)');
      view.handleKeyPress('', { name: 'return' } as any);

      // Paso 2: Archivo
      rendered = stripAnsi(view.render(80, 24).join('\n'));
      expect(rendered).toContain('PASO 2 DE 5');
      view.handleKeyPress('', { name: 'return' } as any);

      // Paso 3: Novela destino
      rendered = stripAnsi(view.render(80, 24).join('\n'));
      expect(rendered).toContain('PASO 3 DE 5');
      expect(rendered).toContain('Mi Novela Fantástica');
      view.handleKeyPress('', { name: 'return' } as any);

      // Paso 4: Vista previa
      rendered = stripAnsi(view.render(80, 24).join('\n'));
      expect(rendered).toContain('PASO 4 DE 5');
      view.handleKeyPress('', { name: 'return' } as any);

      // Paso 5: Confirmación final
      rendered = stripAnsi(view.render(80, 24).join('\n'));
      expect(rendered).toContain('PASO 5 DE 5');
      expect(rendered).toContain('CONFIRMACIÓN FINAL');
      view.handleKeyPress('', { name: 'return' } as any);

      expect(confirmed).toBe(true);
    });
  });

  // 7. Diálogo de Confirmación (/logout y /update)
  describe('InteractiveDialogView (/logout)', () => {
    it('debe permitir seleccionar entre Cancelar y Confirmar con flechas horizontales', () => {
      let confirmedChoice = '';
      const dialog = new InteractiveDialogView({
        id: 'logout-dialog',
        title: 'CERRAR SESIÓN',
        message: '¿Estás seguro de que deseas cerrar sesión?',
        options: [
          { id: 'cancel', label: 'Cancelar' },
          { id: 'confirm', label: 'Confirmar cierre', isDestructive: true },
        ],
        onConfirm: (optId) => {
          confirmedChoice = optId;
        },
      });

      let rendered = stripAnsi(dialog.render(80, 24).join('\n'));
      expect(rendered).toContain('Cancelar');
      expect(rendered).toContain('Confirmar cierre');

      // Cambiar con flecha derecha
      dialog.handleKeyPress('', { name: 'right' } as any);
      dialog.handleKeyPress('', { name: 'return' } as any);

      expect(confirmedChoice).toBe('confirm');
    });
  });

  // 8. Integración de la Pila de Vistas en AppShell
  describe('AppShell y Pila de Vistas Interactivas', () => {
    it('debe apilar y desapilar vistas limpiamente con pushView y popView', () => {
      const registry = new CommandRegistry();
      const history = new CommandHistory();
      const shell = new AppShell(registry, history);

      expect(shell.getActiveView()).toBeNull();

      const view1 = new InteractiveSettingsView(settingsManager);
      shell.pushView(view1);
      expect(shell.getActiveView()).toBe(view1);

      const view2 = new InteractiveMenuView({ id: 'v2', title: 'Submenú', items: [] });
      shell.pushView(view2);
      expect(shell.getActiveView()).toBe(view2);

      shell.popView();
      expect(shell.getActiveView()).toBe(view1);

      shell.popView();
      expect(shell.getActiveView()).toBeNull();
    });
  });
});
