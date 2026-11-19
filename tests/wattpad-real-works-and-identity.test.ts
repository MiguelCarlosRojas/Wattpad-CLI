import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Application } from '../src/platform/terminal/application';
import { CredentialStore } from '../src/core/security/credential-store';
import { Header } from '../src/platform/terminal/components/header';
import { HomeView } from '../src/platform/terminal/components/home-view';
import { FileSystemManager } from '../src/platform/filesystem/file-system';
import { WattpadUser } from '../src/features/account/types/account.types';
import { RemoteWattpadStory, LocalManuscript } from '../src/features/stories/types/story.types';
import { stripAnsi } from '../src/platform/terminal/theme';

describe('WATTPAD CLI — Identidad Real, Obras de Wattpad y Catálogo Unificado', () => {
  let tempDir: string;
  let credStore: CredentialStore;
  let app: Application;

  const mockRealUser: WattpadUser = {
    id: '475029191',
    username: 'AnMigz',
    name: 'AnMigz',
    avatar: 'https://img.wattpad.com/useravatar/AnMigz.128.533343.jpg',
    description: '🌌 Sigue tu propio ritmo, sin importar las sombras...',
    numStories: 1,
    numFollowing: 3,
    numFollowers: 0,
    numLists: 1,
    votesReceived: 0,
    created: '2025-01-01T00:00:00Z',
  };

  const mockRemoteDraft: RemoteWattpadStory = {
    id: '403307349',
    title: '행복은 존재하지 않는다',
    description: 'Sinopsis de la novela psicológica de misterio...',
    coverUrl: 'https://img.wattpad.com/cover/403307349-256-k34255.jpg',
    genre: 'Misterio / Suspenso',
    tags: ['misterio', 'suspenso'],
    language: 'Español',
    url: 'https://www.wattpad.com/story/403307349',
    published: false,
    numParts: 12,
    publishedCount: 0,
    draftCount: 12,
    parts: [
      { id: 1492193581, title: 'Capítulo 1: ¿Soy suficiente?', draft: true, wordCount: 1400 },
      { id: 1492193582, title: 'Capítulo 2: Sombras silenciosas', draft: true, wordCount: 1650 },
    ],
    lastModified: '2026-02-18T10:00:00Z',
    readCount: 0,
    voteCount: 0,
    commentCount: 0,
  };

  const mockPublishedStory: RemoteWattpadStory = {
    id: '999888777',
    title: 'El Legado de las Sombras',
    description: 'Novela de fantasía oscura publicada oficialmente.',
    coverUrl: null,
    genre: 'Fantasía',
    tags: ['magia', 'aventura'],
    language: 'Español',
    url: 'https://www.wattpad.com/story/999888777',
    published: true,
    numParts: 5,
    publishedCount: 5,
    draftCount: 0,
    parts: [],
    lastModified: '2026-01-15T08:30:00Z',
    readCount: 1250,
    voteCount: 98,
    commentCount: 14,
  };

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `wattpad-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tempDir, { recursive: true });

    // Crear carpeta "Mis novelas" con manuscritos de prueba
    const novelasDir = path.join(tempDir, 'Mis novelas');
    fs.mkdirSync(novelasDir, { recursive: true });

    // Manuscrito 1: Documento .docx en raíz
    fs.writeFileSync(path.join(novelasDir, 'Mi_Primera_Novela.docx'), 'dummy docx content');

    // Manuscrito 2: Documento .txt en raíz
    fs.writeFileSync(path.join(novelasDir, 'Poemas_y_Pensamientos.txt'), 'dummy txt content');

    // Manuscrito 3: Carpeta estructurada con Capitulos
    const subStoryDir = path.join(novelasDir, 'El_Reino_Perdido');
    fs.mkdirSync(path.join(subStoryDir, 'Capitulos'), { recursive: true });
    fs.writeFileSync(path.join(subStoryDir, 'novela.docx'), 'novela content');
    fs.writeFileSync(path.join(subStoryDir, 'Capitulos', '001.docx'), 'cap 1');
    fs.writeFileSync(path.join(subStoryDir, 'Capitulos', '002.docx'), 'cap 2');

    credStore = new CredentialStore(path.join(tempDir, 'vault.enc'));
    app = new Application(tempDir, credStore);
    await app.init();
  });

  afterEach(async () => {
    try {
      await app.shutdown();
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {}
  });

  // 1. Identidad Real del Usuario y Encabezado Oficial
  describe('Identidad del Usuario Autenticado en el Encabezado', () => {
    it('debe mostrar la cuenta real @AnMigz y no nombres ficticios ni tokens', () => {
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
          version: '1.1.0',
          user: 'AnMigz',
          displayName: 'AnMigz',
          isAuthenticated: true,
        },
        config
      );

      const fullText = stripAnsi(lines.join('\n'));
      expect(fullText).toContain('WATTPAD CLI v1.1.0');
      expect(fullText).toContain('● @AnMigz     Conectado');
      expect(fullText).toContain('Cuenta: @AnMigz · AnMigz');
      expect(fullText).not.toContain('@wattpad');
      expect(fullText).not.toContain('@token');
    });

    it('debe mostrar "Cuenta: No se pudo verificar el perfil" si la verificación falla', () => {
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
          version: '1.1.0',
          user: null,
          profileVerified: false,
          isAuthenticated: true,
        },
        config
      );

      const fullText = stripAnsi(lines.join('\n'));
      expect(fullText).toContain('Cuenta: No se pudo verificar el perfil');
    });
  });

  // 2. Escaneo Inteligente de Manuscritos Locales
  describe('Escaneo y Detección de Manuscritos Locales ("Mis novelas")', () => {
    it('debe detectar archivos Word (.docx) y Bloc de Notas (.txt) como manuscritos locales', () => {
      const fsManager = new FileSystemManager(path.join(tempDir, 'Mis novelas'));
      const manuscripts = fsManager.scanLocalManuscripts();

      expect(manuscripts.length).toBe(3);

      const docx = manuscripts.find((m) => m.filename.includes('Mi_Primera_Novela'));
      expect(docx).toBeDefined();
      expect(docx!.format).toBe('docx');
      expect(docx!.status).toBe('Solo disponible localmente');
      expect(docx!.synced).toBe(false);

      const txt = manuscripts.find((m) => m.filename.includes('Poemas_y_Pensamientos'));
      expect(txt).toBeDefined();
      expect(txt!.format).toBe('txt');

      const folderDoc = manuscripts.find((m) => m.filename.includes('El_Reino_Perdido'));
      expect(folderDoc).toBeDefined();
      expect(folderDoc!.chapterCount).toBe(2);
    });
  });

  // 3. Catálogo Unificado y Diferenciación Estricta de Borradores
  describe('Catálogo Unificado /stories y Separación Estricta de Categorías', () => {
    beforeEach(() => {
      app.remoteStories = [mockPublishedStory, mockRemoteDraft];
      app.currentUser = mockRealUser;
    });

    it('/stories debe clasificar y mostrar obras publicadas, borradores de Wattpad y manuscritos locales', async () => {
      const res = await app.executeCommand('/stories');
      expect(res.success).toBe(true);

      const blocks = res.blocks!;
      expect(blocks.length).toBeGreaterThan(3);

      // Tarjeta principal
      expect(blocks[0].title).toBe('CATÁLOGO UNIFICADO DE OBRAS');

      // Obra publicada
      const pubCard = blocks.find((b) => b.title?.includes('El Legado de las Sombras'));
      expect(pubCard).toBeDefined();
      expect(pubCard!.statusBadge).toBe('PUBLICADA EN WATTPAD');

      // Borrador en Wattpad
      const draftCard = blocks.find((b) => b.title?.includes('행복은 존재하지 않는다'));
      expect(draftCard).toBeDefined();
      expect(draftCard!.statusBadge).toBe('BORRADOR EN WATTPAD');
      expect(draftCard!.fields?.some((f) => f.label === 'Identificador' && f.value === '403307349')).toBe(true);
      expect(draftCard!.fields?.some((f) => f.label === 'Número de Capítulos' && f.value.includes('12'))).toBe(true);

      // Manuscrito local
      const localCard = blocks.find((b) => b.statusBadge === 'MANUSCRITO LOCAL - PENDIENTE DE SUBIR A WATTPAD');
      expect(localCard).toBeDefined();
      expect(localCard!.fields?.some((f) => f.label === 'Estado' && f.value.includes('Solo disponible localmente'))).toBe(true);
    });

    it('/stories --published debe mostrar únicamente novelas publicadas en Wattpad', async () => {
      const res = await app.executeCommand('/stories --published');
      expect(res.success).toBe(true);

      const badges = res.blocks!.map((b) => b.statusBadge);
      expect(badges).toContain('PUBLICADA EN WATTPAD');
      expect(badges).not.toContain('BORRADOR EN WATTPAD');
      expect(badges).not.toContain('MANUSCRITO LOCAL - PENDIENTE DE SUBIR A WATTPAD');
    });

    it('/stories --drafts debe mostrar únicamente borradores de Wattpad', async () => {
      const res = await app.executeCommand('/stories --drafts');
      expect(res.success).toBe(true);

      const badges = res.blocks!.map((b) => b.statusBadge);
      expect(badges).toContain('BORRADOR EN WATTPAD');
      expect(badges).not.toContain('PUBLICADA EN WATTPAD');
      expect(badges).not.toContain('MANUSCRITO LOCAL - PENDIENTE DE SUBIR A WATTPAD');
    });

    it('/stories --local debe mostrar únicamente manuscritos locales pendientes', async () => {
      const res = await app.executeCommand('/stories --local');
      expect(res.success).toBe(true);

      const badges = res.blocks!.map((b) => b.statusBadge);
      expect(badges).toContain('MANUSCRITO LOCAL - PENDIENTE DE SUBIR A WATTPAD');
      expect(badges).not.toContain('PUBLICADA EN WATTPAD');
      expect(badges).not.toContain('BORRADOR EN WATTPAD');
    });

    it('/stories search debe filtrar obras y manuscritos por término', async () => {
      const res = await app.executeCommand('/stories search "행복은"');
      expect(res.success).toBe(true);

      expect(res.blocks![0].title).toContain('RESULTADOS DE BÚSQUEDA');
      expect(res.blocks!.some((b) => b.title?.includes('행복은 존재하지 않는다'))).toBe(true);
      expect(res.blocks!.some((b) => b.title?.includes('El Legado de las Sombras'))).toBe(false);
    });
  });

  // 4. Panel Principal (HomeView) con Métricas Reales
  describe('Panel Principal (HomeView) con Contadores Fidedignos', () => {
    it('debe mostrar cantidades exactas: 0 publicadas, 1 borrador en Wattpad y 3 manuscritos locales', () => {
      const manuscripts: LocalManuscript[] = [
        {
          filename: 'm1.docx',
          filePath: '/path/m1.docx',
          relativePath: 'm1.docx',
          format: 'docx',
          detectedTitle: 'M1',
          chapterCount: 1,
          sizeBytes: 1000,
          lastModified: '19/11/2026',
          status: 'Solo disponible localmente',
          synced: false,
        },
        {
          filename: 'm2.docx',
          filePath: '/path/m2.docx',
          relativePath: 'm2.docx',
          format: 'docx',
          detectedTitle: 'M2',
          chapterCount: 1,
          sizeBytes: 1000,
          lastModified: '19/11/2026',
          status: 'Solo disponible localmente',
          synced: false,
        },
        {
          filename: 'm3.txt',
          filePath: '/path/m3.txt',
          relativePath: 'm3.txt',
          format: 'txt',
          detectedTitle: 'M3',
          chapterCount: 1,
          sizeBytes: 1000,
          lastModified: '19/11/2026',
          status: 'Solo disponible localmente',
          synced: false,
        },
      ];

      const lines = HomeView.render({
        user: mockRealUser,
        isAuthenticated: true,
        stories: [],
        chapters: [],
        remoteStories: [mockRemoteDraft], // 0 publicadas, 1 borrador con 12 partes
        localManuscripts: manuscripts, // 3 manuscritos locales
        recentCommands: [],
        width: 80,
      });

      const fullText = stripAnsi(lines.join('\n'));
      expect(fullText).toContain('Novelas publicadas:    0 obra(s) en Wattpad');
      expect(fullText).toContain('Borradores en Wattpad:  1 obra(s) en Wattpad');
      expect(fullText).toContain('Manuscritos locales:    3 archivo(s) (.docx, .txt)');
      expect(fullText).toContain('Capítulos registrados:  12 capítulo(s)');
      expect(fullText).toContain('✓ Word (.docx)');
      expect(fullText).toContain('✓ Bloc de Notas (.txt)');
      expect(fullText).toContain('Google Docs');
    });
  });

  // 5. Comando de Actualización (/refresh y /stories refresh)
  describe('Comando de Actualización (/refresh y /stories refresh)', () => {
    it('debe ejecutar /refresh y retornar tarjeta con resumen actualizado', async () => {
      const res = await app.executeCommand('/refresh');
      expect(res.success).toBe(true);

      const card = res.blocks![0];
      expect(card.title).toBe('ACTUALIZACIÓN DEL CATÁLOGO COMPLETADA');
      expect(card.fields?.some((f) => f.label === 'Manuscritos Locales')).toBe(true);
    });

    it('debe ejecutar /stories refresh como subcomando equivalente', async () => {
      const res = await app.executeCommand('/stories refresh');
      expect(res.success).toBe(true);

      const card = res.blocks![0];
      expect(card.title).toBe('ACTUALIZACIÓN DEL CATÁLOGO COMPLETADA');
    });
  });
});
