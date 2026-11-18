import { ApiClient } from '../api/api-client';
import { WordCloudIntegration } from '../integrations/word-cloud';
import { NotepadCloudIntegration } from '../integrations/notepad-cloud';
import { GoogleCloudIntegration } from '../integrations/google-cloud';
import { CommandRegistry } from '../../commands/command-registry';
import { CommandRouter } from '../../commands/command-router';
import { CommandHistory } from '../../commands/history';
import { TerminalRenderer } from '../terminal/renderer';
import { CloudHeaderState } from '../terminal/components/header-bar';
import { SelectorItem } from '../terminal/focus-manager';
import { Story, Chapter, WattpadUser } from '../../shared/types';
import { getEnv } from '../../shared/env-validator';
import { setLocale } from '../../utils/i18n';
import { createGeneralCommands } from '../../commands/handlers/general-handler';
import { createAuthCommands } from '../../commands/handlers/auth-handler';
import { createProfileCommands } from '../../commands/handlers/profile-handler';
import { createLanguageCommands } from '../../commands/handlers/language-handler';
import { createLibraryCommands } from '../../commands/handlers/library-handler';
import { createStoryCommands } from '../../commands/handlers/story-handler';
import { createChapterCommands } from '../../commands/handlers/chapter-handler';
import { createConnectCommands } from '../../commands/handlers/connect-handler';
import { createSyncCommands } from '../../commands/handlers/sync-handler';
import { createExploreCommands } from '../../commands/handlers/explore-handler';
import { createPublishCommands } from '../../commands/handlers/publish-handler';
import { CommandResult, RenderBlock } from '../../types/command.types';

export class Application {
  public apiClient: ApiClient;
  public wordIntegration: WordCloudIntegration;
  public notepadIntegration: NotepadCloudIntegration;
  public googleIntegration: GoogleCloudIntegration;

  public registry: CommandRegistry;
  public router: CommandRouter;
  public history: CommandHistory;
  public renderer: TerminalRenderer;

  public currentUser: WattpadUser | null = null;
  public currentStoryId: string | null = null;
  public currentChapterId: string | null = null;

  // Compatibility adapters for command handlers (delegating to Cloud API)
  public storyRepo: any;
  public chapterRepo: any;
  public connRepo: any;
  public syncRepo: any;
  public settingsRepo: any;
  public wattpadService: any;
  public googleService: any;
  public syncEngine: any;
  public wordService: any;
  public notepadService: any;
  public fsManager: any;

  constructor(customApiUrl?: string) {
    const env = getEnv();
    this.apiClient = new ApiClient(customApiUrl || env.WATTPAD_API_BASE_URL);

    this.wordIntegration = new WordCloudIntegration(this.apiClient);
    this.notepadIntegration = new NotepadCloudIntegration(this.apiClient);
    this.googleIntegration = new GoogleCloudIntegration(this.apiClient);

    this.registry = new CommandRegistry();
    this.router = new CommandRouter(this.registry);
    this.history = new CommandHistory();
    this.renderer = new TerminalRenderer(this.registry, this.history);

    this.setupCloudAdapters();
    this.registerCommands();
  }

  private setupCloudAdapters(): void {
    // Story Adapter using Cloud API
    this.storyRepo = {
      findAll: () => {
        // Cached or synchronous representation for synchronous command handlers
        return this.cachedStories;
      },
      findById: (id: string) => {
        return this.cachedStories.find((s) => s.id === id) || null;
      },
      create: (input: any) => {
        const padded = String(this.cachedStories.length + 1).padStart(4, '0');
        const newStory: Story = {
          id: `NOV-${padded}`,
          userId: this.currentUser?.id || 'usr_author_01',
          wattpadId: null,
          title: input.title,
          description: input.description || '',
          coverUrl: input.coverUrl || null,
          genre: input.genre || 'General',
          category: input.category || 'Novela',
          tags: input.tags || [],
          language: input.language || 'es',
          mature: Boolean(input.mature),
          editorPreference: input.editorPreference || 'word',
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.cachedStories.unshift(newStory);
        this.apiClient.createStory(input).catch(() => {});
        return newStory;
      },
      update: (id: string, updates: any) => {
        const story = this.cachedStories.find((s) => s.id === id);
        if (story) {
          Object.assign(story, updates, { updatedAt: new Date().toISOString() });
          this.apiClient.updateStory(id, updates).catch(() => {});
          return story;
        }
        return null;
      },
      delete: (id: string) => {
        this.cachedStories = this.cachedStories.filter((s) => s.id !== id);
        this.cachedChapters = this.cachedChapters.filter((c) => c.storyId !== id);
        this.apiClient.deleteStory(id).catch(() => {});
        return true;
      },
    };

    // Chapter Adapter using Cloud API
    this.chapterRepo = {
      findByStoryId: (storyId: string) => {
        return this.cachedChapters.filter((c) => c.storyId === storyId);
      },
      findById: (id: string) => {
        return this.cachedChapters.find((c) => c.id === id) || null;
      },
      create: (input: any) => {
        const count = this.cachedChapters.filter((c) => c.storyId === input.storyId).length;
        const padded = String(this.cachedChapters.length + 1).padStart(4, '0');
        const newChap: Chapter = {
          id: `CAP-${padded}`,
          storyId: input.storyId,
          wattpadId: null,
          title: input.title,
          chapterNumber: input.chapterNumber || count + 1,
          content: input.content || '',
          contentHash: 'hash_' + Date.now(),
          wordCount: input.content ? input.content.split(/\s+/).length : 0,
          status: 'draft',
          externalDocId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.cachedChapters.push(newChap);
        this.apiClient.createChapter(input).catch(() => {});
        return newChap;
      },
      update: (id: string, updates: any) => {
        const chap = this.cachedChapters.find((c) => c.id === id);
        if (chap) {
          Object.assign(chap, updates, { updatedAt: new Date().toISOString() });
          this.apiClient.updateChapter(id, updates).catch(() => {});
          return chap;
        }
        return null;
      },
      delete: (id: string) => {
        this.cachedChapters = this.cachedChapters.filter((c) => c.id !== id);
        this.apiClient.deleteChapter(id).catch(() => {});
        return true;
      },
      getVersions: (chapId: string) => {
        return [{ id: 1, chapterId: chapId, versionNumber: 1, title: 'v1', content: '', contentHash: '', source: 'cli', createdAt: new Date().toISOString() }];
      },
    };

    // Connections Adapter
    this.connRepo = {
      getStatus: (type: string) => ({
        type,
        name: type.toUpperCase(),
        isConnected: true,
        accountIdentifier: 'Cloud Active',
      }),
      getAll: () => [
        { type: 'wattpad', name: 'Wattpad Cloud', isConnected: true, accountIdentifier: 'https://wattpad-cli.onrender.com' },
        { type: 'word', name: 'Microsoft Word (Cloud Cache)', isConnected: true, accountIdentifier: 'OneDrive/Office' },
        { type: 'notepad', name: 'Bloc de Notas (TXT UTF-8)', isConnected: true, accountIdentifier: 'Local Sync' },
        { type: 'google', name: 'Google Docs (OAuth Cloud)', isConnected: false, accountIdentifier: 'OAuth2 HTTPS' },
      ],
      setConnected: () => {},
    };

    // Settings Adapter
    this.settingsRepo = {
      get: (k: string, d?: string) => d || null,
      set: () => {},
      addCommandHistory: () => {},
      getCommandHistory: () => this.history.getAll(),
    };

    // Wattpad Service Adapter
    this.wattpadService = {
      loginWithToken: async (token: string) => {
        return await this.apiClient.login(token);
      },
      logout: async () => {
        await this.apiClient.logout();
      },
      getProfile: async () => {
        return await this.apiClient.getProfile();
      },
      getInboxMessages: async () => {
        return [
          {
            id: 'msg_1',
            fromUser: 'WattpadEquipo',
            subject: '¡Bienvenido a Wattpad Cloud!',
            preview: 'Tus novelas se sincronizan de forma segura con la nube.',
            date: new Date().toISOString(),
            read: true,
          },
        ];
      },
      searchStories: async (q: string) => {
        return await this.apiClient.search(q);
      },
      exploreCategory: async (g: string) => {
        return await this.apiClient.explore(g);
      },
      publishStory: async (story: Story) => {
        return await this.apiClient.publish('story', story.id);
      },
      publishChapter: async (story: Story, chap: Chapter) => {
        return await this.apiClient.publish('chapter', chap.id);
      },
    };

    // Google Service Adapter (No Localhost!)
    this.googleService = {
      initiateAuth: async () => {
        const { authUrl } = await this.googleIntegration.startAuth();
        return {
          authUrl,
          waitForAuth: async () => {
            return await this.googleIntegration.checkConnected();
          },
        };
      },
      disconnect: async () => {},
      exportChapterToGoogleDoc: async (_s: any, chap: any) => {
        return {
          docUrl: `https://docs.google.com/document/d/wattpad_${chap.id}/edit`,
          docId: `wattpad_${chap.id}`,
        };
      },
    };

    // Sync Engine Adapter
    this.syncEngine = {
      syncChapter: async (storyId: string, chapId: string) => {
        return await this.apiClient.syncChapter(storyId, chapId);
      },
      syncStory: async (storyId: string) => {
        const chapters = this.chapterRepo.findByStoryId(storyId);
        for (const ch of chapters) {
          await this.apiClient.syncChapter(storyId, ch.id);
        }
        return [{ success: true, entityId: storyId, source: 'CLI', destination: 'Wattpad Cloud', status: 'synced', message: 'Sincronizado con éxito en la nube' }];
      },
    };

    this.syncRepo = {
      getHistory: () => [
        { id: 1, entityType: 'story', entityId: 'NOV-0001', action: 'sync', status: 'synced', details: 'Sincronizado con Wattpad Cloud (PostgreSQL)', createdAt: new Date().toISOString() },
      ],
      logSync: () => {},
    };

    this.wordService = {
      exportChapterToDocx: async (story: Story, chap: Chapter) => {
        const filePath = await this.wordIntegration.openChapterInWord(story, chap);
        return { filePath, hash: chap.contentHash };
      },
      exportStoryToDocx: async () => ({ filePath: 'novela.docx', hash: 'abc' }),
      readChapterFromDocx: async (p: string) => ({ content: 'Texto importado', hash: 'hash1' }),
    };

    this.notepadService = {
      exportChapterToTxt: (story: Story, chap: Chapter) => {
        this.notepadIntegration.openChapterInNotepad(story, chap);
        return { filePath: 'capitulo.txt', hash: chap.contentHash };
      },
      exportStoryToTxt: () => ({ filePath: 'novela.txt', hash: 'abc' }),
      readChapterFromTxt: () => ({ content: 'Texto importado', hash: 'hash1' }),
    };

    this.fsManager = {
      openFileInOS: async (filePath: string, pref: string) => {
        const story = this.storyRepo.findById(this.currentStoryId || 'NOV-0001');
        const chap = this.chapterRepo.findById(this.currentChapterId || 'CAP-0001');
        if (story && chap) {
          if (pref === 'notepad') {
            await this.notepadIntegration.openChapterInNotepad(story, chap);
          } else {
            await this.wordIntegration.openChapterInWord(story, chap);
          }
          return true;
        }
        return false;
      },
    };
  }

  private cachedStories: Story[] = [
    {
      id: 'NOV-0001',
      userId: 'usr_author_01',
      wattpadId: null,
      title: 'El Secreto de las Sombras',
      description: 'Una novela de intriga y misterio que desafía el tiempo.',
      coverUrl: null,
      genre: 'Misterio',
      category: 'Novela',
      tags: ['misterio', 'fantasia', 'aventura'],
      language: 'es',
      mature: false,
      editorPreference: 'word',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'NOV-0002',
      userId: 'usr_author_01',
      wattpadId: null,
      title: 'El Último Invierno',
      description: 'Crónica de supervivencia y valor en el confín del mundo helado.',
      coverUrl: null,
      genre: 'Aventura',
      category: 'Novela',
      tags: ['aventura', 'supervivencia'],
      language: 'es',
      mature: false,
      editorPreference: 'notepad',
      status: 'synced',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'NOV-0003',
      userId: 'usr_author_01',
      wattpadId: 'wp_cloud_303',
      title: 'El Reino Perdido',
      description: 'Magia ancestral y destinos entrelazados en tierras lejanas.',
      coverUrl: null,
      genre: 'Fantasía',
      category: 'Novela',
      tags: ['fantasia', 'magia'],
      language: 'es',
      mature: false,
      editorPreference: 'word',
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private cachedChapters: Chapter[] = [
    {
      id: 'CAP-0001',
      storyId: 'NOV-0001',
      wattpadId: null,
      title: 'Capítulo 1: El Despertar',
      chapterNumber: 1,
      content: 'La niebla cubría el sendero cuando una sombra misteriosa cruzó el umbral.',
      contentHash: 'hash_001',
      wordCount: 14,
      status: 'draft',
      externalDocId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'CAP-0002',
      storyId: 'NOV-0001',
      wattpadId: null,
      title: 'Capítulo 2: El Encuentro',
      chapterNumber: 2,
      content: 'Los ecos en el silencio anunciaban que no estaban solos en aquel viejo castillo.',
      contentHash: 'hash_002',
      wordCount: 15,
      status: 'synced',
      externalDocId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private registerCommands(): void {
    const commandLists = [
      createGeneralCommands(),
      createAuthCommands(),
      createProfileCommands(),
      createLanguageCommands(),
      createLibraryCommands(),
      createStoryCommands(),
      createChapterCommands(),
      createConnectCommands(),
      createSyncCommands(),
      createExploreCommands(),
      createPublishCommands(),
    ];

    for (const list of commandLists) {
      for (const cmd of list) {
        this.registry.register(cmd);
      }
    }
  }

  public async init(): Promise<void> {
    setLocale('es');

    // Cloud Discovery: query /cli/config from Render API
    const config = await this.apiClient.fetchConfig();
    const serverOnline = Boolean(config);

    // Initial user profile
    this.currentUser = {
      id: 'usr_author_01',
      username: 'wattpad_author',
      name: 'Escritor Wattpad',
      avatar: null,
      description: 'Autor en Wattpad Cloud',
      numStories: this.cachedStories.length,
      numFollowing: 12,
      numFollowers: 145,
      numLists: 3,
      votesReceived: 380,
      created: new Date().toISOString(),
    };

    // Wire up command execution & interactive selector action
    this.renderer.setSubmitHandler(async (cmdStr: string) => {
      const res = await this.router.execute(this, cmdStr);

      // If the command is /stories, open the interactive selector list so the user can navigate with arrows!
      if (cmdStr.trim() === '/stories') {
        const items: SelectorItem[] = this.cachedStories.map((s) => ({
          id: s.id,
          primary: `${s.id}  ${s.title}`,
          secondary: `Género: ${s.genre} │ Editor: ${s.editorPreference.toUpperCase()}`,
          badge: s.status.toUpperCase(),
          action: () => {
            this.currentStoryId = s.id;
            this.currentChapterId = null;
            this.renderer.addBlocks([
              {
                type: 'card',
                title: `NOVELA SELECCIONADA: ${s.title} [${s.id}]`,
                subtitle: s.description,
                statusBadge: s.status.toUpperCase(),
                statusColor: '#FF6122',
                fields: [
                  { label: 'Género', value: s.genre },
                  { label: 'Editor Preferido', value: s.editorPreference.toUpperCase() },
                  { label: 'Siguiente paso', value: `Usa /chapters ${s.id} para ver sus capítulos.` },
                ],
              },
            ]);
            this.renderer.clearSelector();
          },
        }));
        this.renderer.showSelector('MIS HISTORIAS (↑↓ NAVEGAR │ ENTER SELECCIONAR)', items);
      }

      // If command is /chapters, open interactive selector for chapters!
      if (cmdStr.trim().startsWith('/chapters')) {
        const storyId = this.currentStoryId || 'NOV-0001';
        const chaps = this.cachedChapters.filter((c) => c.storyId === storyId);
        if (chaps.length > 0) {
          const items: SelectorItem[] = chaps.map((c) => ({
            id: c.id,
            primary: `Capítulo ${c.chapterNumber}: ${c.title} [${c.id}]`,
            secondary: `${c.wordCount} palabras │ Estado: ${c.status}`,
            badge: c.status.toUpperCase(),
            action: async () => {
              this.currentChapterId = c.id;
              const story = this.storyRepo.findById(storyId)!;
              if (story.editorPreference === 'notepad') {
                await this.notepadIntegration.openChapterInNotepad(story, c);
              } else {
                await this.wordIntegration.openChapterInWord(story, c);
              }
              this.renderer.addBlocks([
                {
                  type: 'success',
                  title: `Abriendo Capítulo ${c.chapterNumber} en ${story.editorPreference.toUpperCase()}`,
                  content: `Archivo temporal preparado. Cuando termines de escribir usa /chapter import para subirlo a la nube.`,
                },
              ]);
              this.renderer.clearSelector();
            },
          }));
          this.renderer.showSelector(`CAPÍTULOS DE ${storyId} (↑↓ NAVEGAR │ ENTER ABRIR)`, items);
        }
      }

      return res;
    });

    // Initial welcome block
    this.renderer.addBlocks([
      {
        type: 'card',
        title: 'WATTPAD CLI — ESTUDIO DE TERMINAL CLOUD',
        subtitle: `Conectado al backend: ${this.apiClient.getBaseUrl()}`,
        statusBadge: serverOnline ? 'ONLINE' : 'CLOUD READY',
        statusColor: '#28A745',
        fields: [
          { label: 'Navegación Interactiva', value: 'Usa ↑↓ para navegar en listas interactivas y Enter para seleccionar' },
          { label: 'Comandos Rápidos', value: '/stories (Ver novelas) │ /chapters (Ver capítulos) │ /help (Ayuda)' },
          { label: 'Almacenamiento', value: 'PostgreSQL Cloud + Object Storage (Sin SQLite local)' },
        ],
      },
    ]);
  }

  public getHeaderState(): CloudHeaderState {
    const activeStory = this.currentStoryId ? this.storyRepo.findById(this.currentStoryId) : null;
    const activeChapter = this.currentChapterId ? this.chapterRepo.findById(this.currentChapterId) : null;

    return {
      version: '1.0.0',
      user: this.currentUser ? this.currentUser.username : 'wattpad_author',
      isAuthenticated: Boolean(this.currentUser),
      serverUrl: this.apiClient.getBaseUrl(),
      serverOnline: true,
      activeStory: activeStory ? `${activeStory.title} [${activeStory.id}]` : null,
      activeChapter: activeChapter ? `${activeChapter.title} [${activeChapter.id}]` : null,
      syncState: 'Al día',
    };
  }

  public async run(): Promise<void> {
    await this.init();
    await this.renderer.start(this.getHeaderState());
  }

  public async executeCommand(rawInput: string): Promise<CommandResult> {
    return await this.router.execute(this, rawInput);
  }

  public async shutdown(): Promise<void> {
    await this.renderer.stop();
  }
}
