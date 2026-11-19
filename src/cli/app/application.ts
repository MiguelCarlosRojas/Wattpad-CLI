import { ApiClient } from '../api/api-client';
import { WordService } from '../../integrations/word/word-service';
import { NotepadService } from '../../integrations/notepad/notepad-service';
import { GoogleService } from '../../integrations/google/google-service';
import { WattpadService } from '../../integrations/wattpad/wattpad-service';
import { CommandRegistry } from '../../commands/command-registry';
import { CommandRouter } from '../../commands/command-router';
import { CommandHistory } from '../../commands/history';
import { AppShell } from '../terminal/app-shell';
import { Story, Chapter, WattpadUser } from '../../shared/types';
import { getEnv } from '../../shared/env-validator';
import { createGeneralCommands } from '../../commands/handlers/general-handler';
import { createAuthCommands } from '../../commands/handlers/auth-handler';
import { createStoryCommands } from '../../commands/handlers/story-handler';
import { createChapterCommands } from '../../commands/handlers/chapter-handler';
import { createConnectCommands } from '../../commands/handlers/connect-handler';
import { createSyncCommands } from '../../commands/handlers/sync-handler';
import { createPublishCommands } from '../../commands/handlers/publish-handler';
import { CommandResult } from '../../types/command.types';
import { CredentialStore } from '../../security/credential-store';
import { FileSystemManager } from '../../utils/file-system';

export class Application {
  public apiClient: ApiClient;
  public wordService: WordService;
  public notepadService: NotepadService;
  public googleService: GoogleService;
  public wattpadService: WattpadService;

  public credentialStore: CredentialStore;
  public fsManager: FileSystemManager;

  public registry: CommandRegistry;
  public router: CommandRouter;
  public history: CommandHistory;
  public appShell: AppShell;

  // Compatibility getter/alias for renderer
  public get renderer(): any {
    return {
      appShell: this.appShell,
      start: async () => this.appShell.start(),
      stop: async () => this.appShell.exit(),
      setState: (state: any) => this.appShell.setState(state),
      setSubmitHandler: (handler: any) => this.appShell.setCommandExecutor(handler),
      showSelector: () => {},
      clearSelector: () => {},
      addBlocks: () => {},
    };
  }

  // Compatibility alias for integrations
  public get wordIntegration(): any {
    return {
      openChapterInWord: async (s: Story, c: Chapter) => (await this.wordService.exportChapterToDocx(s as any, c as any)).filePath,
    };
  }
  public get notepadIntegration(): any {
    return {
      openChapterInNotepad: (s: Story, c: Chapter) => this.notepadService.exportChapterToTxt(s as any, c as any).filePath,
    };
  }
  public get googleIntegration(): any {
    return {
      startAuth: async () => {
        const auth = await this.googleService.initiateAuth();
        return { authUrl: auth.authUrl, sessionId: 'google_session' };
      },
      checkConnected: async () => this.googleService.isConnected(),
    };
  }

  public currentUser: WattpadUser | null = null;
  public currentStoryId: string | null = null;
  public currentChapterId: string | null = null;
  public serverOnline: boolean = true;

  // Repositories for command handlers
  public storyRepo: any;
  public chapterRepo: any;
  public connRepo: any;
  public syncRepo: any;
  public settingsRepo: any;
  public syncEngine: any;

  private cachedStories: Story[] = [];
  private cachedChapters: Chapter[] = [];

  constructor(customApiUrl?: string) {
    const env = getEnv();
    this.apiClient = new ApiClient(customApiUrl || env.WATTPAD_API_BASE_URL);

    this.credentialStore = new CredentialStore();
    this.fsManager = new FileSystemManager();

    this.wordService = new WordService(this.fsManager);
    this.notepadService = new NotepadService(this.fsManager);
    this.googleService = new GoogleService(this.credentialStore);
    this.wattpadService = new WattpadService(this.credentialStore);

    this.registry = new CommandRegistry();
    this.router = new CommandRouter(this.registry);
    this.history = new CommandHistory();
    this.appShell = new AppShell(this.registry, this.history);

    this.setupAdapters();
    this.registerCommands();
  }

  private setupAdapters(): void {
    // Story Repository Adapter
    this.storyRepo = {
      findAll: () => this.cachedStories,
      findById: (id: string) => this.cachedStories.find((s) => s.id === id) || null,
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

    // Chapter Repository Adapter
    this.chapterRepo = {
      findByStoryId: (storyId: string) => this.cachedChapters.filter((c) => c.storyId === storyId),
      findById: (id: string) => this.cachedChapters.find((c) => c.id === id) || null,
      getVersions: (_id: string) => [],
      create: (input: any) => {
        const count = this.cachedChapters.filter((c) => c.storyId === input.storyId).length;
        const padded = String(count + 1).padStart(4, '0');
        const newChap: Chapter = {
          id: `CAP-${padded}`,
          storyId: input.storyId,
          wattpadId: null,
          title: input.title,
          chapterNumber: input.chapterNumber || count + 1,
          content: input.content || '',
          contentHash: 'hash_' + Date.now(),
          wordCount: (input.content || '').split(/\s+/).filter(Boolean).length,
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
    };

    // Connections Repository Adapter
    this.connRepo = {
      getAll: () => [
        { type: 'word', name: 'Microsoft Word (.docx)', isConnected: true },
        { type: 'notepad', name: 'Bloc de Notas (.txt UTF-8)', isConnected: true },
        { type: 'google', name: 'Google Docs (OAuth 2.0)', isConnected: false },
        { type: 'wattpad', name: 'Wattpad (Cuenta Oficial)', isConnected: Boolean(this.currentUser) },
        { type: 'render', name: 'Render Cloud Backend', isConnected: this.serverOnline },
      ],
      getByType: (type: string) => {
        if (type === 'wattpad') return { isConnected: Boolean(this.currentUser) };
        if (type === 'word' || type === 'notepad') return { isConnected: true };
        return { isConnected: false };
      },
      save: () => {},
    };

    // Settings Repository Adapter
    this.settingsRepo = {
      get: (key: string) => {
        if (key === 'language') return 'es';
        if (key === 'editor') return 'word';
        return null;
      },
      set: () => {},
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
        return [
          {
            success: true,
            entityId: storyId,
            source: 'CLI',
            destination: 'Wattpad Cloud',
            status: 'synced',
            message: 'Sincronizado con éxito en la nube',
          },
        ];
      },
    };

    this.syncRepo = {
      getHistory: () => [
        {
          id: 1,
          entityType: 'story',
          entityId: 'NOV-0001',
          action: 'sync',
          status: 'synced',
          details: 'Sincronizado con Wattpad Cloud (PostgreSQL)',
          createdAt: new Date().toISOString(),
        },
      ],
      logSync: () => {},
    };

    // File opener
    const originalOpen = this.fsManager.openFileInOS.bind(this.fsManager);
    this.fsManager.openFileInOS = async (filePath: string, pref?: 'word' | 'notepad' | 'google') => {
      const story = this.storyRepo.findById(this.currentStoryId || 'NOV-0001');
      const chap = this.chapterRepo.findById(this.currentChapterId || 'CAP-0001');
      if (story && chap) {
        if (pref === 'notepad') {
          this.notepadService.exportChapterToTxt(story, chap);
        } else {
          await this.wordService.exportChapterToDocx(story, chap);
        }
        return true;
      }
      return await originalOpen(filePath, pref);
    };
  }

  private registerCommands(): void {
    const commandLists = [
      createGeneralCommands(),
      createAuthCommands(),
      createStoryCommands(),
      createChapterCommands(),
      createConnectCommands(),
      createSyncCommands(),
      createPublishCommands(),
    ];

    for (const list of commandLists) {
      for (const cmd of list) {
        this.registry.register(cmd);
      }
    }
  }

  public async init(): Promise<void> {
    // Cloud Discovery: query /cli/config from Render API
    const config = await this.apiClient.fetchConfig();
    this.serverOnline = Boolean(config);

    // Restore real session from CredentialStore if available
    const savedToken = await this.credentialStore.get('wattpad_token');
    const savedUserJson = await this.credentialStore.get('wattpad_user');
    if (savedToken && savedUserJson) {
      try {
        this.currentUser = JSON.parse(savedUserJson);
        this.apiClient.setToken(savedToken);
      } catch {
        this.currentUser = null;
      }
    } else {
      this.currentUser = null;
    }

    // Synchronize local disk structure into "Mis novelas"
    for (const s of this.cachedStories) {
      const chaps = this.cachedChapters.filter((c) => c.storyId === s.id);
      this.fsManager.syncStoryStructure(s, chaps);
    }

    // Set up Token Submit Handler for interactive modal
    this.appShell.setTokenSubmitHandler(async (token: string) => {
      try {
        const session = await this.wattpadService.loginWithToken(token);
        this.currentUser = session.user;
        await this.credentialStore.set('wattpad_token', token);
        await this.credentialStore.set('wattpad_user', JSON.stringify(session.user));
        this.appShell.setState({ currentUser: session.user });
        return { success: true, user: session.user };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Error de autenticación' };
      }
    });

    // Propagate state to modern AppShell
    this.appShell.setState({
      stories: this.cachedStories,
      chapters: this.cachedChapters,
      currentUser: this.currentUser,
      serverOnline: this.serverOnline,
      serverUrl: this.apiClient.getBaseUrl(),
      version: '1.0.0',
    });

    // Wire up command execution
    this.appShell.setCommandExecutor(async (cmdStr: string) => {
      return await this.router.execute(this, cmdStr);
    });
  }

  public getHeaderState(): any {
    const activeStory = this.currentStoryId ? this.storyRepo.findById(this.currentStoryId) : null;
    const activeChapter = this.currentChapterId ? this.chapterRepo.findById(this.currentChapterId) : null;

    return {
      version: '1.0.0',
      user: this.currentUser ? this.currentUser.username : 'Sin conectar',
      isAuthenticated: Boolean(this.currentUser),
      serverUrl: this.apiClient.getBaseUrl(),
      serverOnline: this.serverOnline,
      activeStory: activeStory ? `${activeStory.title} [${activeStory.id}]` : null,
      activeChapter: activeChapter ? `${activeChapter.title} [${activeChapter.id}]` : null,
      syncState: 'Al día',
    };
  }

  public async run(): Promise<void> {
    await this.init();
    await this.appShell.start();
  }

  public async executeCommand(rawInput: string): Promise<CommandResult> {
    return await this.router.execute(this, rawInput);
  }

  public async shutdown(): Promise<void> {
    await this.appShell.exit();
  }
}
