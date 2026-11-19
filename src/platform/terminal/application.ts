import { WordService } from '../filesystem/word-service';
import { NotepadService } from '../filesystem/notepad-service';
import { GoogleService } from '../google/google-service';
import { WattpadService } from '../wattpad/wattpad-service';
import { CommandRegistry } from '../../features/commands/command-registry';
import { CommandRouter } from '../../features/commands/command-router';
import { CommandHistory } from '../../features/commands/history';
import { AppShell } from './app-shell';
import { WattpadUser } from '../../features/account/types/account.types';
import { Story } from '../../features/stories/types/story.types';
import { Chapter } from '../../features/chapters/types/chapter.types';
import { createGeneralCommands } from '../../features/commands/handlers/general-handler';
import { createAuthCommands } from '../../features/account/handlers/auth-handler';
import { createStoryCommands } from '../../features/stories/handlers/story-handler';
import { createChapterCommands } from '../../features/chapters/handlers/chapter-handler';
import { createConnectCommands } from '../../features/connections/handlers/connect-handler';
import { createSyncCommands } from '../../features/documents/handlers/sync-handler';
import { createPublishCommands } from '../../features/publishing/handlers/publish-handler';
import { CommandResult } from '../../core/types/command.types';
import { CredentialStore } from '../../core/security/credential-store';
import { FileSystemManager } from '../filesystem/file-system';
import { StoryManager } from '../../features/stories/managers/story-manager';
import { ChapterManager } from '../../features/chapters/managers/chapter-manager';
import { DocumentManager } from '../../features/documents/managers/document-manager';
import { ConnectionManager } from '../../features/connections/managers/connection-manager';
import { SettingsManager } from '../../core/config/settings-manager';
import { SyncManager } from '../sync/sync-manager';
import { BackupManager } from '../sync/backup-manager';
import { SyncEngine } from '../sync/sync-engine';

export class Application {
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
      openChapterInWord: async (s: Story, c: Chapter) => (await this.wordService.exportChapterToDocx(s, c)).filePath,
    };
  }
  public get notepadIntegration(): any {
    return {
      openChapterInNotepad: (s: Story, c: Chapter) => this.notepadService.exportChapterToTxt(s, c).filePath,
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

  // In-Memory and JSON-backed sovereign workspace managers (No Database)
  public storyRepo: StoryManager;
  public chapterRepo: ChapterManager;
  public docRepo: DocumentManager;
  public connRepo: ConnectionManager;
  public syncRepo: SyncManager;
  public settingsRepo: SettingsManager;
  public syncEngine: SyncEngine;
  public backupManager: BackupManager;

  constructor(customConfigDir?: string, customCredentialStore?: CredentialStore) {
    this.credentialStore = customCredentialStore || new CredentialStore();
    this.fsManager = new FileSystemManager();

    this.wordService = new WordService(this.fsManager);
    this.notepadService = new NotepadService(this.fsManager);
    this.googleService = new GoogleService(this.credentialStore);
    this.wattpadService = new WattpadService(this.credentialStore);

    // Initializing sovereign workspace managers (no database engine)
    this.storyRepo = new StoryManager();
    this.chapterRepo = new ChapterManager();
    this.docRepo = new DocumentManager();
    this.connRepo = new ConnectionManager();
    this.syncRepo = new SyncManager();
    this.settingsRepo = new SettingsManager(customConfigDir);
    this.backupManager = new BackupManager();

    this.syncEngine = new SyncEngine(
      this.storyRepo,
      this.chapterRepo,
      this.docRepo,
      this.syncRepo,
      this.wordService,
      this.notepadService,
      this.googleService,
      this.wattpadService,
      this.backupManager
    );

    this.registry = new CommandRegistry();
    this.router = new CommandRouter(this.registry);
    this.history = new CommandHistory();
    this.appShell = new AppShell(this.registry, this.history);

    this.registerCommands();
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
    // 1. Restaurar sesión autenticada de Wattpad desde almacén seguro local
    this.currentUser = await this.wattpadService.getProfile();

    if (this.currentUser) {
      this.connRepo.setConnected('wattpad', 'Wattpad', true, this.currentUser.username);
    }

    // 2. Cargar historias y capítulos desde el workspace en memoria / local
    const stories = this.storyRepo.findAll();
    const allChapters = this.chapterRepo.findAll();

    // 3. Configurar manejador de envío de token (compatibilidad con AuthModal)
    this.appShell.setTokenSubmitHandler(async (token: string) => {
      try {
        const session = await this.wattpadService.loginWithToken(token);
        this.currentUser = session.user;
        this.connRepo.setConnected('wattpad', 'Wattpad', true, session.user.username);
        this.appShell.setState({ currentUser: session.user });
        return { success: true, user: session.user };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Error de autenticación' };
      }
    });

    // 4. Propagar estado real a AppShell
    this.appShell.setState({
      stories,
      chapters: allChapters,
      currentUser: this.currentUser,
      version: '1.1.0',
    });

    // 5. Conectar router de comandos con la terminal interactiva
    this.appShell.setCommandExecutor(async (cmdStr: string) => {
      return await this.router.execute(this, cmdStr);
    });
  }

  public getHeaderState(): any {
    const activeStory = this.currentStoryId ? this.storyRepo.findById(this.currentStoryId) : null;
    const activeChapter = this.currentChapterId ? this.chapterRepo.findById(this.currentChapterId) : null;

    return {
      version: '1.1.0',
      user: this.currentUser ? this.currentUser.username : 'Sin conectar',
      isAuthenticated: Boolean(this.currentUser),
      activeStory: activeStory ? `${activeStory.title} [${activeStory.id}]` : null,
      activeChapter: activeChapter ? `${activeChapter.title} [${activeChapter.id}]` : null,
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
