import { WordService } from '../../integrations/word/word-service';
import { NotepadService } from '../../integrations/notepad/notepad-service';
import { GoogleService } from '../../integrations/google/google-service';
import { WattpadService } from '../../integrations/wattpad/wattpad-service';
import { CommandRegistry } from '../../commands/command-registry';
import { CommandRouter } from '../../commands/command-router';
import { CommandHistory } from '../../commands/history';
import { AppShell } from '../terminal/app-shell';
import { WattpadUser } from '../../types/auth.types';
import { Story } from '../../types/story.types';
import { Chapter } from '../../types/chapter.types';
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
import { getDatabase } from '../../database/db';
import { StoryRepository } from '../../database/repositories/story-repository';
import { ChapterRepository } from '../../database/repositories/chapter-repository';
import { DocumentRepository } from '../../database/repositories/document-repository';
import { ConnectionRepository } from '../../database/repositories/connection-repository';
import { SyncRepository } from '../../database/repositories/sync-repository';
import { SettingsRepository } from '../../database/repositories/settings-repository';
import { BackupManager } from '../../sync/backup-manager';
import { SyncEngine } from '../../sync/sync-engine';

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

  // Real SQLite Repositories
  public storyRepo: StoryRepository;
  public chapterRepo: ChapterRepository;
  public docRepo: DocumentRepository;
  public connRepo: ConnectionRepository;
  public syncRepo: SyncRepository;
  public settingsRepo: SettingsRepository;
  public syncEngine: SyncEngine;
  public backupManager: BackupManager;

  constructor(customDbPath?: string, customCredentialStore?: CredentialStore) {
    const db = getDatabase(customDbPath);

    this.credentialStore = customCredentialStore || new CredentialStore();
    this.fsManager = new FileSystemManager();

    this.wordService = new WordService(this.fsManager);
    this.notepadService = new NotepadService(this.fsManager);
    this.googleService = new GoogleService(this.credentialStore);
    this.wattpadService = new WattpadService(this.credentialStore);

    // Initializing real SQLite persistence repositories
    this.storyRepo = new StoryRepository(db);
    this.chapterRepo = new ChapterRepository(db);
    this.docRepo = new DocumentRepository(db);
    this.connRepo = new ConnectionRepository(db);
    this.syncRepo = new SyncRepository(db);
    this.settingsRepo = new SettingsRepository(db);
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

    // 2. Cargar historias y capítulos reales desde SQLite
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
