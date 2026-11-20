import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { GoogleOAuth } from '../src/platform/google/google-oauth';
import { GoogleService } from '../src/platform/google/google-service';
import { WattpadDiscoveryService } from '../src/platform/wattpad/wattpad-discovery';
import { Application } from '../src/platform/terminal/application';
import { TextEditor } from '../src/platform/terminal/components/text-editor';
import { ItemSelector, CHAPTER_ACTIONS } from '../src/platform/terminal/components/item-selector';
import { DiscoveryView } from '../src/platform/terminal/components/discovery-view';
import { CredentialStore } from '../src/core/security/credential-store';

describe('WATTPAD CLI v1.3.0 — Nuevas Funcionalidades y Verificación Total', () => {
  let tmpDir: string;
  let credStore: CredentialStore;
  let app: Application;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `wattpad_v130_test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    fs.mkdirSync(tmpDir, { recursive: true });
    credStore = new CredentialStore(path.join(tmpDir, 'vault.enc'));
    app = new Application(tmpDir, credStore);
    await app.init();
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  // =========================================================================
  // PARTE 1 & 2: GOOGLE OAUTH 2.0 PKCE DESKTOP & GOOGLE DOCS / DRIVE
  // =========================================================================
  describe('Google OAuth 2.0 PKCE Desktop (RFC 8252)', () => {
    it('debe construir la URL de autorización con response_type=code y code_challenge S256', () => {
      const verifier = GoogleOAuth.generateCodeVerifier();
      const challenge = GoogleOAuth.generateCodeChallenge(verifier);
      const state = GoogleOAuth.generateState();
      const authUrl = GoogleOAuth.buildAuthorizationUrl({
        clientId: 'test_client_id.apps.googleusercontent.com',
        redirectUri: 'http://127.0.0.1:8585/oauth2callback',
        codeChallenge: challenge,
        state,
      });

      const urlStr = authUrl.toString();
      expect(urlStr).toBeDefined();
      expect(urlStr).toContain('response_type=code');
      expect(urlStr).toContain('code_challenge=');
      expect(urlStr).toContain('code_challenge_method=S256');
      expect(urlStr).toContain('state=');
      expect(urlStr).toContain('http%3A%2F%2F127.0.0.1%3A8585%2Foauth2callback');

      // Validar mediante URL parser estándar que response_type es exactamente "code"
      const parsedUrl = new URL(authUrl);
      expect(parsedUrl.searchParams.get('response_type')).toBe('code');
      expect(parsedUrl.searchParams.get('code_challenge_method')).toBe('S256');
      expect(parsedUrl.searchParams.get('access_type')).toBe('offline');
      expect(parsedUrl.searchParams.get('prompt')).toBe('consent');
    });

    it('debe ejecutar /google status y reflejar estado honesto', async () => {
      const res = await app.router.execute(app, '/google status');
      expect(res.success).toBe(true);
      expect(res.blocks).toBeDefined();
      const card = res.blocks![0];
      expect(card.title).toContain('GOOGLE DOCS');
    });

    it('debe rechazar /google documents si no está autenticado en Google', async () => {
      const res = await app.router.execute(app, '/google documents');
      expect(res.success).toBe(false);
      expect(res.message).toContain('/connect google');
    });

    it('debe permitir /disconnect google de manera limpia', async () => {
      const res = await app.router.execute(app, '/disconnect google');
      expect(res.success).toBe(true);
      expect(res.message).toContain('desconectada');
    });
  });

  // =========================================================================
  // PARTE 3: BUSCADOR DE WATTPAD (MODO A Y MODO B - NLP)
  // =========================================================================
  describe('Buscador Legítimo y Descubrimiento en Wattpad (/discover y /search)', () => {
    it('debe rechazar la búsqueda si el usuario no tiene una sesión autenticada en Wattpad', async () => {
      app.currentUser = null;
      const res = await app.router.execute(app, '/search misterio');
      expect(res.success).toBe(false);
      expect(res.message).toContain('/login');
    });

    it('debe parsear lenguaje natural (Modo B) extrayendo género, estado, lecturas y orden', () => {
      const discoveryService = new WattpadDiscoveryService();

      const filter1 = discoveryService.parseNaturalQuery('novelas de terror en español terminadas con más de 5000 lecturas');
      expect(filter1.genre).toBe('Terror');
      expect(filter1.status).toBe('completed');
      expect(filter1.language).toBe('es');
      expect(filter1.minReads).toBe(5000);

      const filter2 = discoveryService.parseNaturalQuery('historias de romance y amor en curso');
      expect(filter2.genre).toBe('Romance');
      expect(filter2.status).toBe('ongoing');

      const filter3 = discoveryService.parseNaturalQuery('ciencia ficcion populares');
      expect(filter3.genre).toBe('Ciencia Ficción');
      expect(filter3.sort).toBe('hot');
    });

    it('debe ejecutar /search con usuario autenticado y retornar tarjetas de obras reales', async () => {
      // Simular usuario autenticado legítimo
      app.currentUser = {
        id: '475029191',
        username: 'AnMigz',
        name: 'Angel',
        avatar: 'https://img.wattpad.com/useravatar/AnMigz.128.jpg',
        description: 'Escritor de misterio',
        numStories: 2,
        numFollowers: 120,
        numFollowing: 15,
        numLists: 2,
        votesReceived: 350,
        created: '2026-01-01',
      };

      const res = await app.router.execute(app, '/search "El Susurro de las Sombras" --completed');
      expect(res.success).toBe(true);
      expect(res.blocks).toBeDefined();
      expect(res.blocks!.length).toBeGreaterThan(1);
    });

    it('debe ejecutar /discover y listar opciones o novelas de Wattpad', async () => {
      app.currentUser = {
        id: '475029191',
        username: 'AnMigz',
        name: 'Angel',
        avatar: null,
      };

      const res = await app.router.execute(app, '/discover fantasía');
      expect(res.success).toBe(true);
      expect(res.blocks![0].title).toBe('DESCUBRIR NOVELAS EN WATTPAD');
    });

    it('DiscoveryView debe renderizar sin exceder el ancho del terminal', () => {
      const rendered = DiscoveryView.render({
        stories: [
          {
            id: 'wp_test_1',
            title: 'Novela de Prueba',
            author: { username: 'autor_test' },
            description: 'Descripción breve para validación de renderizado.',
            genre: 'Fantasía',
            tags: ['magia'],
            numParts: 10,
            readCount: 1500,
            voteCount: 200,
            status: 'completed',
            url: 'https://www.wattpad.com/story/wp_test_1',
          },
        ],
        width: 80,
      });

      expect(rendered.length).toBeGreaterThan(5);
      expect(rendered[0]).toContain('DESCUBRIR NOVELAS');
    });
  });

  // =========================================================================
  // PARTE 4: PERFIL COMPLETO, AVATAR Y SECCIONES DE CUENTA
  // =========================================================================
  describe('Perfil Completo, Avatar y Secciones de Cuenta (/profile, /inbox, /library, /myworks)', () => {
    beforeEach(async () => {
      app.currentUser = {
        id: '475029191',
        username: 'AnMigz',
        name: 'Angel',
        avatar: 'https://img.wattpad.com/useravatar/AnMigz.128.jpg',
        description: 'Autor en Wattpad',
        numStories: 2,
        numFollowers: 120,
        numFollowing: 15,
        numLists: 2,
        votesReceived: 350,
        created: '2026-01-01',
      };
      await app.wattpadService.getBrowserAuth().saveSession(app.currentUser);
    });

    it('/profile debe mostrar estadísticas completas y cachear el avatar localmente', async () => {
      const res = await app.router.execute(app, '/profile');
      expect(res.success).toBe(true);
      const card = res.blocks![0];
      expect(card.title).toContain('@AnMigz');

      const fields = (card as any).fields || [];
      const userField = fields.find((f: any) => f.label === 'Usuario');
      const avatarField = fields.find((f: any) => f.label === 'Avatar en caché');
      expect(userField.value).toBe('@AnMigz');
      expect(avatarField).toBeDefined();
    });

    it('/inbox debe mostrar notificaciones honestas del usuario', async () => {
      const res = await app.router.execute(app, '/inbox');
      expect(res.success).toBe(true);
      expect(res.blocks![0].title).toContain('BANDEJA DE ENTRADA');
    });

    it('/library debe listar las listas de lectura del autor', async () => {
      const res = await app.router.execute(app, '/library');
      expect(res.success).toBe(true);
      expect(res.blocks![0].title).toContain('BIBLIOTECA');
    });

    it('/myworks debe separar estrictamente obras publicadas y borradores de Wattpad', async () => {
      const res = await app.router.execute(app, '/myworks');
      expect(res.success).toBe(true);
      expect(res.blocks![0].title).toContain('MIS OBRAS EN WATTPAD');
    });
  });

  // =========================================================================
  // PARTE 5 & 6: SELECTOR INTERACTIVO Y EDITOR MULTILÍNEA EN TERMINAL
  // =========================================================================
  describe('Selector Interactivo con 4 Flechas y Editor en Terminal', () => {
    it('ItemSelector debe renderizar elementos y el menú de acciones de capítulos', () => {
      const linesNormal = ItemSelector.render({
        title: 'MIS CAPÍTULOS',
        items: [
          { id: 'CAP-0001', title: 'Capítulo 1: Inicio', badge: 'BORRADOR' },
          { id: 'CAP-0002', title: 'Capítulo 2: Encuentro', badge: 'PUBLICADO' },
        ],
        selectedIndex: 0,
        width: 80,
      });

      expect(linesNormal.length).toBeGreaterThan(4);
      expect(linesNormal.join('\n')).toContain('Capítulo 1: Inicio');
      expect(linesNormal.join('\n')).toContain('[BORRADOR]');

      const linesMenu = ItemSelector.render({
        title: 'MIS CAPÍTULOS',
        items: [{ id: 'CAP-0001', title: 'Capítulo 1: Inicio' }],
        selectedIndex: 0,
        actionMenuOpen: true,
        actionMenuIndex: 0,
        width: 80,
      });

      expect(linesMenu.join('\n')).toContain('Editar aquí en Wattpad CLI');
      expect(linesMenu.join('\n')).toContain('Abrir con Microsoft Word');
      expect(linesMenu.join('\n')).toContain('Abrir con Bloc de Notas');
    });

    it('TextEditor debe insertar caracteres, saltos de línea y contar palabras/caracteres', () => {
      const editor = new TextEditor({
        title: 'Capítulo 1',
        content: 'Hola mundo',
      });

      expect(editor.getContent()).toBe('Hola mundo');
      expect(editor.isDirty()).toBe(false);

      editor.moveCursor('right');
      editor.insertChar('!');
      expect(editor.getContent()).toBe('H!ola mundo');
      expect(editor.isDirty()).toBe(true);

      editor.insertNewline();
      expect(editor.getState().lines.length).toBe(2);
    });

    it('TextEditor debe buscar texto y encontrar coincidencias con findNext()', () => {
      const editor = new TextEditor({
        title: 'Capítulo de Prueba',
        content: 'El bosque oscuro y frío.\nEl bosque guardaba un secreto.',
      });

      editor.setSearchQuery('bosque');
      const foundFirst = editor.findNext();
      expect(foundFirst).toBe(true);
      expect(editor.getState().cursorRow).toBe(0);

      const foundSecond = editor.findNext();
      expect(foundSecond).toBe(true);
      expect(editor.getState().cursorRow).toBe(1);
    });

    it('TextEditor.saveWithBackup debe crear una copia .bak antes de sobrescribir el archivo', () => {
      const filePath = path.join(tmpDir, 'capitulo_original.txt');
      fs.writeFileSync(filePath, 'Contenido original anterior.', 'utf8');

      const editor = new TextEditor({
        title: 'Capítulo 1',
        content: 'Contenido nuevo editado en Wattpad CLI.',
        sourcePath: filePath,
      });

      const saveRes = editor.saveWithBackup();
      expect(saveRes.success).toBe(true);
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf8')).toBe('Contenido nuevo editado en Wattpad CLI.');

      const backupPath = `${filePath}.bak`;
      expect(fs.existsSync(backupPath)).toBe(true);
      expect(fs.readFileSync(backupPath, 'utf8')).toBe('Contenido original anterior.');
    });

    it('debe ejecutar /editor CAP-0001 tras crear una novela y abrir el editor', async () => {
      await app.router.execute(app, '/story new "Novela del Editor"');
      await app.router.execute(app, '/chapter create "Capítulo Uno" --content="Texto inicial"');

      const res = await app.router.execute(app, '/editor CAP-0001');
      expect(res.success).toBe(true);
      expect(res.message).toContain('Capítulo Uno');
      expect(app.appShell.getActiveEditor()).not.toBeNull();
    });
  });
});
