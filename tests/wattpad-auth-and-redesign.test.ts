import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { Application } from '../src/cli/app/application';
import { Header } from '../src/cli/terminal/components/header';
import { CommandInput } from '../src/cli/terminal/components/command-input';
import { CredentialStore } from '../src/security/credential-store';
import { stripAnsi } from '../src/cli/terminal/theme';
import { DocumentParser } from '../src/integrations/document-parser';

describe('WATTPAD CLI — Login Real, Navegador Controlado, Gestión Documental y Rediseño Total', () => {
  let app: Application;
  let testVaultDir: string;
  let credStore: CredentialStore;
  let testDbPath: string;

  beforeEach(async () => {
    testVaultDir = path.join(os.tmpdir(), `wattpad_auth_test_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(testVaultDir, { recursive: true });
    credStore = new CredentialStore(path.join(testVaultDir, 'vault.enc'));
    testDbPath = path.join(testVaultDir, 'test_wattpad.db');

    app = new Application(testDbPath, credStore);
    await app.init();
  });

  afterEach(async () => {
    try {
      await app.shutdown();
      if (fs.existsSync(testVaultDir)) {
        fs.rmSync(testVaultDir, { recursive: true, force: true });
      }
    } catch {}
  });

  // 1. Rediseño Minimalista del Encabezado e Input
  describe('Rediseño de Terminal: Estado Superior e Input Box', () => {
    it('debe renderizar el encabezado desconectado mostrando únicamente WATTPAD CLI v1.0.0 ○ Sin conexión', () => {
      const config = {
        width: 80,
        height: 24,
        breakpoint: 'STANDARD' as const,
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
          user: null,
          isAuthenticated: false,
        },
        config
      );

      const text = stripAnsi(lines[0]);
      expect(text).toContain('WATTPAD CLI v1.0.0');
      expect(text).toContain('○ Sin conexión');
      expect(text).not.toContain('Cloud Postgres');
      expect(text).not.toContain('Render');
    });

    it('debe renderizar el encabezado conectado mostrando WATTPAD CLI v1.0.0 ● @usuario Conectado', () => {
      const config = {
        width: 80,
        height: 24,
        breakpoint: 'STANDARD' as const,
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
          user: 'autor_oficial',
          isAuthenticated: true,
        },
        config
      );

      const text = stripAnsi(lines[0]);
      expect(text).toContain('WATTPAD CLI v1.0.0');
      expect(text).toContain('● @autor_oficial');
      expect(text).toContain('Conectado');
    });

    it('debe renderizar la caja de entrada moderna inspirada en el diseño conceptual', () => {
      const lines = CommandInput.render('', 0, 80, true);
      const text = stripAnsi(lines.join('\n'));

      expect(text).toContain('╭');
      expect(text).toContain('❯');
      expect(text).toContain('Escribe un comando o selecciona una operación');
      expect(text).toContain('╰');
      expect(text).toContain('? Ayuda · / Comandos · Ctrl+C Salir');
    });
  });

  // 2. Autenticación Real de Wattpad y Gestión de Sesión
  describe('Autenticación Real, Cierre de Sesión y Reconexión', () => {
    it('/profile en estado desconectado debe informar que Wattpad está desconectado', async () => {
      const res = await app.executeCommand('/profile');
      expect(res.success).toBe(true);
      expect(res.message).toContain('Desconectado');
      expect(app.currentUser).toBeNull();
    });

    it('/login interactivo debe iniciar sesión y guardar de forma segura el perfil', async () => {
      const res = await app.executeCommand('/login');
      expect(res.success).toBe(true);
      expect(res.blocks![0].title).toBe('WATTPAD CONECTADO');
      expect(res.blocks![0].statusBadge).toBe('CONECTADO');

      expect(app.currentUser).not.toBeNull();
      expect(app.currentUser!.username).toBeDefined();

      // Verificar que /profile devuelve el usuario conectado
      const profRes = await app.executeCommand('/profile');
      expect(profRes.success).toBe(true);
      expect(profRes.blocks![0].title).toContain(`@${app.currentUser!.username}`);
    });

    it('/logout debe exigir confirmación antes de eliminar el perfil local', async () => {
      await app.executeCommand('/login');
      expect(app.currentUser).not.toBeNull();

      // Sin confirmación
      const unconfirmed = await app.executeCommand('/logout');
      expect(unconfirmed.blocks![0].type).toBe('warning');
      expect(unconfirmed.blocks![0].title).toContain('CONFIRMACIÓN');
      expect(app.currentUser).not.toBeNull();

      // Con confirmación
      const confirmed = await app.executeCommand('/logout --confirm');
      expect(confirmed.success).toBe(true);
      expect(app.currentUser).toBeNull();
    });

    it('debe permitir reconectarse con /login tras haber cerrado sesión', async () => {
      await app.executeCommand('/login');
      await app.executeCommand('/logout --confirm');
      expect(app.currentUser).toBeNull();

      // Reconectar
      const reconnectRes = await app.executeCommand('/login');
      expect(reconnectRes.success).toBe(true);
      expect(app.currentUser).not.toBeNull();
    });
  });

  // 3. Document Parser y Segmentación de Capítulos
  describe('Administrador Documental e Importación Inteligente', () => {
    it('debe detectar capítulos y títulos desde contenido con separadores', () => {
      const rawText = `El Reino Olvidado\n\nCapítulo 1: El Despertar de la Magia\nHabía una vez en un reino distante...\n\nCapítulo 2: El Encuentro en el Bosque\nCaminando entre los árboles antiguos...`;
      const result = DocumentParser.parseRawContent(rawText, 'manuscrito.txt', 'txt');

      expect(result.chapters.length).toBe(2);
      expect(result.chapters[0].title).toContain('Capítulo 1: El Despertar de la Magia');
      expect(result.chapters[0].content).toContain('Había una vez');
      expect(result.chapters[1].title).toContain('Capítulo 2: El Encuentro en el Bosque');
      expect(result.chapters[1].content).toContain('Caminando entre los árboles');
    });

    it('/chapter import debe mostrar vista previa y NO publicar automáticamente', async () => {
      // Crear novela
      await app.executeCommand('/story create "Novela Test"');
      const storyId = app.currentStoryId!;

      // Crear archivo temporal
      const tempDocPath = path.join(testVaultDir, 'capitulos.txt');
      fs.writeFileSync(
        tempDocPath,
        `Capítulo 1: Inicio\nPrimer párrafo de la historia.\n\nCapítulo 2: Continuación\nSegundo párrafo de la historia.`,
        'utf8'
      );

      // Importar sin --confirm (debe mostrar vista previa)
      const preview = await app.executeCommand(`/chapter import "${tempDocPath}"`);
      expect(preview.success).toBe(true);
      expect(preview.blocks![0].title).toContain('VISTA PREVIA DE IMPORTACIÓN');
      expect(preview.blocks![0].statusBadge).toContain('2 CAPÍTULOS DETECTADOS');
      // No debieron crearse en la base de datos aún
      expect(app.chapterRepo.findByStoryId(storyId).length).toBe(0);

      // Confirmar importación con --confirm
      const confirmed = await app.executeCommand(`/chapter import "${tempDocPath}" --confirm`);
      expect(confirmed.success).toBe(true);
      expect(confirmed.blocks![0].title).toContain('IMPORTACIÓN DOCUMENTAL CONFIRMADA');
      expect(app.chapterRepo.findByStoryId(storyId).length).toBe(2);

      // Verificar que los capítulos se importaron como borradores y NO están publicados
      const chapters = app.chapterRepo.findByStoryId(storyId);
      expect(chapters[0].status).toBe('draft');
      expect(chapters[1].status).toBe('draft');
    });
  });

  // 4. Eliminación Total de Render y Datos Ficticios
  describe('Eliminación Total de Datos Ficticios y Render', () => {
    it('una base de datos vacía debe retornar una lista vacía con mensaje honesto', async () => {
      const res = await app.executeCommand('/stories');
      expect(res.success).toBe(true);
      expect(res.blocks![0].content).toContain('No tienes novelas disponibles en esta cuenta.');
    });

    it('/connect NO debe mostrar Render Cloud Backend bajo ningún concepto', async () => {
      const res = await app.executeCommand('/connect');
      expect(res.success).toBe(true);
      const content = JSON.stringify(res.blocks);
      expect(content).not.toContain('Render Cloud Backend');
      expect(content).not.toContain('PostgreSQL');
      expect(content).toContain('Microsoft Word');
      expect(content).toContain('Bloc de Notas');
      expect(content).toContain('Google Docs');
      expect(content).toContain('Wattpad');
    });

    it('/story delete debe exigir confirmación explícita con --confirm', async () => {
      await app.executeCommand('/story create "Novela Peligrosa"');
      const storyId = app.currentStoryId!;

      // Sin confirmación
      const unconfirmed = await app.executeCommand(`/story delete ${storyId}`);
      expect(unconfirmed.blocks![0].type).toBe('warning');
      expect(app.storyRepo.findById(storyId)).not.toBeNull();

      // Con confirmación
      const confirmed = await app.executeCommand(`/story delete ${storyId} --confirm`);
      expect(confirmed.success).toBe(true);
      expect(app.storyRepo.findById(storyId)).toBeNull();
    });

    it('/chapter delete debe exigir confirmación explícita con --confirm', async () => {
      await app.executeCommand('/story create "Novela con Capítulos"');
      const storyId = app.currentStoryId!;
      await app.executeCommand(`/chapter create "Capítulo Uno"`);
      const chapterId = app.currentChapterId!;

      // Sin confirmación
      const unconfirmed = await app.executeCommand(`/chapter delete ${chapterId}`);
      expect(unconfirmed.blocks![0].type).toBe('warning');
      expect(app.chapterRepo.findById(chapterId)).not.toBeNull();

      // Con confirmación
      const confirmed = await app.executeCommand(`/chapter delete ${chapterId} --confirm`);
      expect(confirmed.success).toBe(true);
      expect(app.chapterRepo.findById(chapterId)).toBeNull();
    });
  });
});
