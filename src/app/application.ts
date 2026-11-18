import { Database } from 'bun:sqlite';
import { getDatabase, closeDatabase } from '../database/db';
import { StoryRepository } from '../database/repositories/story-repository';
import { ChapterRepository } from '../database/repositories/chapter-repository';
import { DocumentRepository } from '../database/repositories/document-repository';
import { ConnectionRepository } from '../database/repositories/connection-repository';
import { SyncRepository } from '../database/repositories/sync-repository';
import { SettingsRepository } from '../database/repositories/settings-repository';
import { CredentialStore } from '../security/credential-store';
import { FileSystemManager } from '../utils/file-system';
import { WordService } from '../integrations/word/word-service';
import { NotepadService } from '../integrations/notepad/notepad-service';
import { GoogleService } from '../integrations/google/google-service';
import { WattpadService } from '../integrations/wattpad/wattpad-service';
import { BackupManager } from '../sync/backup-manager';
import { SyncEngine } from '../sync/sync-engine';
import { CommandRegistry } from '../commands/command-registry';
import { CommandRouter } from '../commands/command-router';
import { CommandHistory } from '../commands/history';
import { TerminalRenderer } from '../cli/terminal/renderer';
import { HeaderState } from '../cli/terminal/components/header-bar';
import { WattpadUser } from '../types/auth.types';
import { setLocale } from '../utils/i18n';
import { createGeneralCommands } from '../commands/handlers/general-handler';
import { createAuthCommands } from '../commands/handlers/auth-handler';
import { createProfileCommands } from '../commands/handlers/profile-handler';
import { createLanguageCommands } from '../commands/handlers/language-handler';
import { createLibraryCommands } from '../commands/handlers/library-handler';
import { createStoryCommands } from '../commands/handlers/story-handler';
import { createChapterCommands } from '../commands/handlers/chapter-handler';
import { createConnectCommands } from '../commands/handlers/connect-handler';
import { createSyncCommands } from '../commands/handlers/sync-handler';
import { createExploreCommands } from '../commands/handlers/explore-handler';
import { createPublishCommands } from '../commands/handlers/publish-handler';
import { CommandResult } from '../types/command.types';

export class Application {
  public db: Database;
  public storyRepo: StoryRepository;
  public chapterRepo: ChapterRepository;
  public docRepo: DocumentRepository;
  public connRepo: ConnectionRepository;
  public syncRepo: SyncRepository;
  public settingsRepo: SettingsRepository;

  public credentialStore: CredentialStore;
  public fsManager: FileSystemManager;
  public backupManager: BackupManager;

  public wordService: WordService;
  public notepadService: NotepadService;
  public googleService: GoogleService;
  public wattpadService: WattpadService;
  public syncEngine: SyncEngine;

  public registry: CommandRegistry;
  public router: CommandRouter;
  public history: CommandHistory;
  public renderer: TerminalRenderer;

  public currentUser: WattpadUser | null = null;
  public currentStoryId: string | null = null;
  public currentChapterId: string | null = null;

  constructor(dbPath?: string) {
    this.db = getDatabase(dbPath);
    this.storyRepo = new StoryRepository(this.db);
    this.chapterRepo = new ChapterRepository(this.db);
    this.docRepo = new DocumentRepository(this.db);
    this.connRepo = new ConnectionRepository(this.db);
    this.syncRepo = new SyncRepository(this.db);
    this.settingsRepo = new SettingsRepository(this.db);

    this.credentialStore = new CredentialStore();
    this.fsManager = new FileSystemManager();
    this.backupManager = new BackupManager();

    this.wordService = new WordService(this.fsManager);
    this.notepadService = new NotepadService(this.fsManager);
    this.googleService = new GoogleService(this.credentialStore);
    this.wattpadService = new WattpadService(this.credentialStore);

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
    const savedHistory = this.settingsRepo.getCommandHistory(50);
    this.history = new CommandHistory(savedHistory);
    this.renderer = new TerminalRenderer(this.registry, this.history);

    this.registerCommands();
  }

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
    // Restore language preference
    const lang = this.settingsRepo.get('language', 'es') as 'es' | 'en';
    setLocale(lang);

    // Restore user session if available
    const session = await this.wattpadService.getSession();
    if (session) {
      this.currentUser = session.user;
      this.connRepo.setConnected('wattpad', 'Wattpad Cloud', true, session.user.username);
    }

    // Auto-detect word & notepad local connections
    this.connRepo.setConnected('word', 'Microsoft Word (.docx)', true, 'Local Office');
    this.connRepo.setConnected('notepad', 'Bloc de Notas (.txt)', true, 'Local Text Editor');

    // Wire command execution
    this.renderer.setSubmitHandler(async (cmd: string) => {
      this.settingsRepo.addCommandHistory(cmd);
      return await this.router.execute(this, cmd);
    });

    // Add initial welcome blocks
    this.renderer.addBlocks([
      {
        type: 'card',
        title: 'WATTPAD CLI — ESTUDIO DE TERMINAL PROFESIONAL',
        subtitle: 'Escribe en Word o Bloc de Notas, administra capítulos y sincroniza con Wattpad.',
        statusBadge: 'LISTO',
        statusColor: '#28A745',
        fields: [
          { label: 'Comandos rápidos', value: '/stories (Ver novelas) | /story new (Crear novela) | /help (Ayuda)' },
          { label: 'Editor soportado', value: 'Microsoft Word (.docx), Bloc de Notas (.txt), Google Docs' },
          { label: 'Modo de trabajo', value: 'Borrador privado local (nada se publica sin tu confirmación)' },
        ],
      },
    ]);
  }

  public getHeaderState(): HeaderState {
    const activeStory = this.currentStoryId ? this.storyRepo.findById(this.currentStoryId) : null;
    const activeChapter = this.currentChapterId ? this.chapterRepo.findById(this.currentChapterId) : null;
    const wordConn = this.connRepo.getStatus('word');
    const notepadConn = this.connRepo.getStatus('notepad');
    const googleConn = this.connRepo.getStatus('google');

    return {
      version: '1.0.0',
      user: this.currentUser ? this.currentUser.username : 'Local',
      isConnected: Boolean(this.currentUser),
      activeStory: activeStory ? `${activeStory.title} [${activeStory.id}]` : null,
      activeChapter: activeChapter ? `${activeChapter.title} [${activeChapter.id}]` : null,
      wordConnected: wordConn.isConnected,
      notepadConnected: notepadConn.isConnected,
      googleConnected: googleConn.isConnected,
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
    closeDatabase();
  }
}
