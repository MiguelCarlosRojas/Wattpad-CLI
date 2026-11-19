import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { Application } from '../src/cli/app/application';
import { AuthModal } from '../src/cli/terminal/components/auth-modal';
import { Header } from '../src/cli/terminal/components/header';
import { CommandInput } from '../src/cli/terminal/components/command-input';
import { CredentialStore } from '../src/security/credential-store';
import { stripAnsi } from '../src/cli/terminal/theme';

describe('WATTPAD CLI — Login Real, Ventana de Autorización, Gestión de Cuenta y Rediseño Total', () => {
  let app: Application;
  let testVaultDir: string;
  let credStore: CredentialStore;

  beforeEach(async () => {
    testVaultDir = path.join(os.tmpdir(), `wattpad_auth_test_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(testVaultDir, { recursive: true });
    credStore = new CredentialStore(path.join(testVaultDir, 'vault.enc'));

    app = new Application();
    app.credentialStore = credStore;
    app.wattpadService = app.wattpadService;
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

  // 1. Modal de Autorización Compacto
  describe('Ventana Emergente de Autorización (AuthModal)', () => {
    it('debe renderizar el modal compacto con estado inicial y campos requeridos', () => {
      const lines = AuthModal.render(
        {
          isOpen: true,
          tokenValue: 'secret_token_12345',
          focus: 'token',
          status: 'waiting',
        },
        80
      );

      const text = stripAnsi(lines.join('\n'));
      expect(text).toContain('Conectar cuenta de Wattpad');
      expect(text).toContain('Inicia sesión en el navegador que se abrió.');
      expect(text).toContain('Estado: Esperando autorización');
      expect(text).toContain('Si dispones de un token oficial autorizado');
      expect(text).toContain('Token:');
      // Masked input: verifies no cleartext token is displayed
      expect(text).not.toContain('secret_token_12345');
      expect(text).toContain('*****************');
      expect(text).toContain('[ Conectar ]');
      expect(text).toContain('[ Cancelar ]');
    });

    it('debe renderizar la ventana de éxito una vez autorizada la cuenta con datos reales', () => {
      const lines = AuthModal.render(
        {
          isOpen: true,
          tokenValue: 'secret_token',
          focus: 'connect',
          status: 'success',
          authenticatedUser: {
            username: 'escritor_real',
            id: 'wp_998877',
          },
        },
        80
      );

      const text = stripAnsi(lines.join('\n'));
      expect(text).toContain('Wattpad conectado');
      expect(text).toContain('Cuenta: @escritor_real');
      expect(text).toContain('Estado: Autorizada');
      expect(text).toContain('Sesión: Válida');
      expect(text).not.toContain('Esperando autorización');
    });

    it('debe mostrar error de verificación cuando el token es inválido', () => {
      const lines = AuthModal.render(
        {
          isOpen: true,
          tokenValue: 'invalid_token',
          focus: 'token',
          status: 'error',
          errorMessage: 'Token rechazado por Wattpad',
        },
        80
      );

      const text = stripAnsi(lines.join('\n'));
      expect(text).toContain('Estado: Token rechazado por Wattpad');
    });
  });

  // 2. Nuevo Encabezado y Campo de Entrada (Rediseño Vork/Wattpad)
  describe('Rediseño de Terminal: Encabezado y Campo de Entrada', () => {
    it('debe renderizar el encabezado desconectado fiel al diseño conceptual', () => {
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
          user: 'Sin conectar',
          isAuthenticated: false,
        },
        config
      );

      const text = stripAnsi(lines.join('\n'));
      expect(text).toContain('WATTPAD CLI v1.0.0');
      expect(text).toContain('◉');
      expect(text).toContain('Cuenta: Sin conectar');
      expect(text).not.toContain('Cloud Postgres');
      expect(text).not.toContain('wattpad_author');
    });

    it('debe renderizar el encabezado conectado con el usuario real', () => {
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
          user: 'novela_author',
          isAuthenticated: true,
        },
        config
      );

      const text = stripAnsi(lines.join('\n'));
      expect(text).toContain('WATTPAD CLI v1.0.0');
      expect(text).toContain('◉');
      expect(text).toContain('Cuenta: @novela_author · Wattpad conectado');
    });

    it('debe renderizar la caja de entrada elegante con marco, título y atajos', () => {
      const lines = CommandInput.render('/login', 6, 80, true);
      const text = stripAnsi(lines.join('\n'));

      expect(text).toContain('╭─ Wattpad CLI');
      expect(text).toContain('❯');
      expect(text).toContain('/login');
      expect(text).toContain('╰─ ? Ayuda · ↑↓ Historial · Tab Autocompletar · Ctrl+C Salir');
    });
  });

  // 3. Flujo de Login y Almacenamiento Seguro
  describe('Autenticación Real, Cierre de Sesión y Reconexión', () => {
    it('/account en estado desconectado debe retornar Wattpad: Desconectado', async () => {
      const res = await app.executeCommand('/account');
      expect(res.success).toBe(true);
      expect(res.message).toBe('Wattpad: Desconectado');
      expect(app.currentUser).toBeNull();
    });

    it('/login sin parámetros debe presentar la guía de conexión y no considerarse autenticado', async () => {
      const res = await app.executeCommand('/login');
      expect(res.success).toBe(true);
      expect(res.blocks![0].title).toBe('CONECTAR CUENTA DE WATTPAD');
      expect(res.blocks![0].statusBadge).toBe('ESPERANDO AUTORIZACIÓN');
      // No fake user
      expect(app.currentUser).toBeNull();
    });

    it('/login con token autorizado debe vincular la cuenta y guardarla localmente en vault cifrado', async () => {
      const res = await app.executeCommand('/login test_token_autorizado_88');
      expect(res.success).toBe(true);
      expect(res.blocks![0].title).toBe('WATTPAD CONECTADO');
      expect(res.blocks![0].statusBadge).toBe('AUTORIZADA');

      expect(app.currentUser).not.toBeNull();
      expect(app.currentUser!.username).toBe('autor_test');

      // Check stored credentials in CredentialStore
      const savedToken = await credStore.get('wattpad_token');
      expect(savedToken).toBe('test_token_autorizado_88');

      // Verify /account reflects connected state
      const accRes = await app.executeCommand('/account');
      expect(accRes.success).toBe(true);
      expect(accRes.message).toContain('Usuario: @autor_test');
      expect(accRes.message).toContain('Estado: Conectado');
    });

    it('/logout debe exigir confirmación para proteger la sesión del usuario', async () => {
      await app.executeCommand('/login test_token_autorizado_88');
      expect(app.currentUser).not.toBeNull();

      // Without --confirm, must warn
      const unconfirmed = await app.executeCommand('/logout');
      expect(unconfirmed.blocks![0].type).toBe('warning');
      expect(unconfirmed.blocks![0].title).toContain('CONFIRMAR CIERRE DE SESIÓN');
      expect(app.currentUser).not.toBeNull(); // Still connected

      // With --confirm, must disconnect and wipe secrets
      const confirmed = await app.executeCommand('/logout --confirm');
      expect(confirmed.success).toBe(true);
      expect(confirmed.message).toBe('Wattpad: Desconectado');
      expect(app.currentUser).toBeNull();

      const savedTokenAfter = await credStore.get('wattpad_token');
      expect(savedTokenAfter).toBeNull();
    });

    it('debe permitir reconectarse con /login tras haber cerrado sesión sin reinstalar', async () => {
      await app.executeCommand('/login test_token_autorizado_88');
      await app.executeCommand('/logout --confirm');
      expect(app.currentUser).toBeNull();

      // Reconnect
      const reconnectRes = await app.executeCommand('/login test_token_autorizado_88');
      expect(reconnectRes.success).toBe(true);
      expect(app.currentUser).not.toBeNull();
      expect(app.currentUser!.username).toBe('autor_test');
    });
  });

  // 4. Eliminación de Datos Ficticios y Operaciones Destructivas
  describe('Eliminación Total de Datos Ficticios y Protección de Documentos', () => {
    it('una base de datos vacía debe retornar una lista vacía de novelas', async () => {
      const res = await app.executeCommand('/stories');
      expect(res.success).toBe(true);
      expect(res.blocks![0].statusBadge).toBe('0 HISTORIAS');
      expect(res.blocks![0].content).toContain('No se encontraron novelas');
    });

    it('/story delete debe exigir confirmación explícita con --confirm', async () => {
      await app.executeCommand('/story new "Novela Peligrosa"');
      const storyId = app.currentStoryId!;

      // Without --confirm
      const unconfirmed = await app.executeCommand(`/story delete ${storyId}`);
      expect(unconfirmed.blocks![0].type).toBe('warning');
      expect(unconfirmed.blocks![0].title).toContain('CONFIRMACIÓN DE ELIMINACIÓN');
      expect(app.storyRepo.findById(storyId)).not.toBeNull(); // Not deleted

      // With --confirm
      const confirmed = await app.executeCommand(`/story delete ${storyId} --confirm`);
      expect(confirmed.success).toBe(true);
      expect(confirmed.blocks![0].statusBadge).toBe('ELIMINADA');
      expect(app.storyRepo.findById(storyId)).toBeNull(); // Deleted
    });

    it('/chapter delete debe exigir confirmación explícita con --confirm', async () => {
      await app.executeCommand('/story new "Novela con Capítulos"');
      const storyId = app.currentStoryId!;
      await app.executeCommand(`/chapter new ${storyId} "Capítulo Uno"`);
      const chapterId = app.currentChapterId!;

      // Without --confirm
      const unconfirmed = await app.executeCommand(`/chapter delete ${storyId} ${chapterId}`);
      expect(unconfirmed.blocks![0].type).toBe('warning');
      expect(unconfirmed.blocks![0].title).toContain('CONFIRMACIÓN DE ELIMINACIÓN DE CAPÍTULO');
      expect(app.chapterRepo.findById(chapterId)).not.toBeNull(); // Preserved

      // With --confirm
      const confirmed = await app.executeCommand(`/chapter delete ${storyId} ${chapterId} --confirm`);
      expect(confirmed.success).toBe(true);
      expect(confirmed.blocks![0].statusBadge).toBe('ELIMINADO');
      expect(app.chapterRepo.findById(chapterId)).toBeNull(); // Deleted
    });

    it('/stories search debe buscar únicamente obras reales locales', async () => {
      await app.executeCommand('/story new "Las Crónicas del Tiempo" --genre=SciFi');
      const res = await app.executeCommand('/stories search "Crónicas"');
      expect(res.success).toBe(true);
      expect(res.blocks![0].title).toContain('RESULTADOS DE BÚSQUEDA');
      expect(res.blocks![0].items![0].primary).toContain('Las Crónicas del Tiempo');

      const resNotFound = await app.executeCommand('/stories search "Inexistente"');
      expect(resNotFound.blocks![0].statusBadge).toBe('0 COINCIDENCIAS');
    });

    it('/connect debe separar honestamente los estados de Wattpad, Word, Notepad, Google y Render', async () => {
      const res = await app.executeCommand('/connect');
      expect(res.success).toBe(true);
      const names = res.blocks!.slice(1).map((b) => b.title);
      expect(names).toContain('Wattpad (Cuenta Oficial)');
      expect(names).toContain('Microsoft Word (.docx)');
      expect(names).toContain('Bloc de Notas (.txt UTF-8)');
      expect(names).toContain('Google Docs (OAuth 2.0)');
      expect(names).toContain('Render Cloud Backend');
    });
  });
});
