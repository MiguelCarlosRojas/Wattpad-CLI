import { TerminalAdapter } from '../platform/terminal/terminal-adapter';
import { AnsiRenderer } from '../platform/terminal/renderer/ansi-renderer';
import { KeyboardListener } from '../platform/terminal/keyboard/keyboard-listener';
import { NavigationManager } from './navigation';
import { SessionManager } from '../auth/session/session-manager';
import { WelcomeView } from '../auth/login/welcome-view';
import { LoginView } from '../auth/login/login-view';
import { RegisterView } from '../auth/register/register-view';
import { MainMenuView } from './main-menu-view';
import { SearchView } from '../features/search/views/search-view';
import { StoryDetailView } from '../features/search/views/story-detail-view';
import { InboxView } from '../features/inbox/views/inbox-view';
import { ConversationView } from '../features/inbox/views/conversation-view';
import { LibraryView } from '../features/library/views/library-view';
import { CreateStoryWizard } from '../features/create-story/views/create-story-wizard';
import { MyStoriesView } from '../features/my-stories/views/my-stories-view';
import { StoryManageView } from '../features/my-stories/views/story-manage-view';
import { ChapterListView } from '../features/chapters/views/chapter-list-view';
import { ChapterEditor } from '../features/chapters/editor/chapter-editor';
import { ChapterService } from '../features/chapters/chapter-service';
import { StoryMetadata } from '../shared/types/story.types';
import { ChapterMetadata } from '../shared/types/chapter.types';
import { SearchResultItem } from '../shared/types/search.types';
import { InboxConversation } from '../shared/types/inbox.types';
import { KeyPressEvent } from '../shared/types/navigation.types';
import { COLORS } from '../shared/constants/colors.constants';

export class AppShell {
  private nav: NavigationManager;
  private isRunning: boolean = false;
  private isPaletteOpen: boolean = false;
  private paletteIndex: number = 0;

  private paletteCommands = [
    { label: '1. Buscar novelas', action: () => this.openSearch() },
    { label: '2. Buzón', action: () => this.openInbox() },
    { label: '3. Biblioteca', action: () => this.openLibrary() },
    { label: '4. Crear historia', action: () => this.openCreateStory() },
    { label: '5. Mis historias', action: () => this.openMyStories() },
    { label: 'Cerrar sesión', action: () => this.logout() },
    { label: 'Salir de Wattpad CLI', action: () => this.shutdown() },
  ];

  constructor() {
    this.nav = new NavigationManager(() => this.requestRender());
  }

  public async start(): Promise<void> {
    this.isRunning = true;
    TerminalAdapter.enterAltBuffer();

    // Comprobar si existe una sesión válida previamente guardada
    const hasSession = await SessionManager.init();

    if (hasSession) {
      await this.nav.setRoot(this.createMainMenuView());
    } else {
      await this.nav.setRoot(this.createWelcomeView());
    }

    KeyboardListener.start(this.handleKeyPress);
    this.requestRender();
  }

  public shutdown(): void {
    this.isRunning = false;
    KeyboardListener.stop();
    TerminalAdapter.exitAltBuffer();
    process.exit(0);
  }

  private requestRender(): void {
    if (!this.isRunning) return;

    const width = TerminalAdapter.getWidth();
    const height = TerminalAdapter.getHeight();
    const activeView = this.nav.getActiveView();

    if (!activeView) return;

    let lines = activeView.render(width, height);

    // Si la paleta Ctrl+P está abierta, superponer diálogo
    if (this.isPaletteOpen) {
      lines = this.renderCommandPalette(lines, width);
    }

    AnsiRenderer.render(lines);
  }

  private handleKeyPress = async (event: KeyPressEvent): Promise<void> => {
    // Ctrl + C: Salida limpia universal
    if (event.ctrl && event.key.toLowerCase() === 'c') {
      this.shutdown();
      return;
    }

    // Ctrl + P: Paleta de comandos
    if (event.ctrl && event.key.toLowerCase() === 'p') {
      this.isPaletteOpen = !this.isPaletteOpen;
      this.paletteIndex = 0;
      this.requestRender();
      return;
    }

    if (this.isPaletteOpen) {
      if (event.key === 'escape') {
        this.isPaletteOpen = false;
        this.requestRender();
      } else if (event.key === 'up') {
        this.paletteIndex = (this.paletteIndex - 1 + this.paletteCommands.length) % this.paletteCommands.length;
        this.requestRender();
      } else if (event.key === 'down') {
        this.paletteIndex = (this.paletteIndex + 1) % this.paletteCommands.length;
        this.requestRender();
      } else if (event.key === 'enter') {
        const cmd = this.paletteCommands[this.paletteIndex];
        this.isPaletteOpen = false;
        if (cmd) cmd.action();
      }
      return;
    }

    const activeView = this.nav.getActiveView();
    if (activeView) {
      await activeView.handleKey(event);
      this.requestRender();
    }
  };

  private renderCommandPalette(lines: string[], width: number): string[] {
    const paletteBox = [
      `  ${COLORS.ORANGE_BG}${COLORS.TEXT_MAIN} PALETA DE COMANDOS (Ctrl+P) ${COLORS.RESET} ${COLORS.TEXT_DIM}[Esc para cerrar]${COLORS.RESET}`,
      '',
    ];

    this.paletteCommands.forEach((cmd, idx) => {
      const isSel = idx === this.paletteIndex;
      const pointer = isSel ? `${COLORS.ORANGE}❯${COLORS.RESET} ` : '  ';
      const labelStyle = isSel ? `${COLORS.BOLD}${COLORS.ORANGE}` : COLORS.TEXT_MAIN;
      paletteBox.push(`  ${pointer}${labelStyle}${cmd.label}${COLORS.RESET}`);
    });

    paletteBox.push('');

    // Insertar encima del pie
    const at = Math.max(2, lines.length - paletteBox.length - 3);
    lines.splice(at, 0, ...paletteBox);
    return lines;
  }

  // === FACTORÍAS DE VISTAS ===

  private createWelcomeView(): WelcomeView {
    return new WelcomeView((option) => {
      if (option === 'login') {
        this.nav.pushView(this.createLoginView());
      } else if (option === 'register') {
        this.nav.pushView(this.createRegisterView());
      } else if (option === 'exit') {
        this.shutdown();
      }
    });
  }

  private createLoginView(): LoginView {
    return new LoginView(
      () => {
        // Al iniciar sesión con éxito, abrir Menú Principal
        this.nav.setRoot(this.createMainMenuView());
      },
      () => {
        this.nav.popView();
      }
    );
  }

  private createRegisterView(): RegisterView {
    return new RegisterView(
      () => {
        this.nav.setRoot(this.createMainMenuView());
      },
      () => {
        this.nav.popView();
      }
    );
  }

  private createMainMenuView(): MainMenuView {
    return new MainMenuView((screen) => {
      if (screen === 'search') this.openSearch();
      else if (screen === 'inbox') this.openInbox();
      else if (screen === 'library') this.openLibrary();
      else if (screen === 'create-story') this.openCreateStory();
      else if (screen === 'my-stories') this.openMyStories();
    });
  }

  public openSearch(): void {
    const view = new SearchView(
      (story: SearchResultItem) => {
        this.nav.pushView(new StoryDetailView(story, () => this.nav.popView()));
      },
      () => this.nav.popView()
    );
    this.nav.pushView(view);
  }

  public openInbox(): void {
    const view = new InboxView(
      (conv: InboxConversation) => {
        this.nav.pushView(new ConversationView(conv, () => this.nav.popView()));
      },
      () => this.nav.popView()
    );
    this.nav.pushView(view);
  }

  public openLibrary(): void {
    const view = new LibraryView(() => this.nav.popView());
    this.nav.pushView(view);
  }

  public openCreateStory(): void {
    const view = new CreateStoryWizard(
      () => {
        // Al terminar, ir a Mis Historias
        this.openMyStories();
      },
      () => this.nav.popView()
    );
    this.nav.pushView(view);
  }

  public openMyStories(): void {
    const view = new MyStoriesView(
      (story: StoryMetadata) => {
        this.openStoryManage(story);
      },
      () => this.nav.popView()
    );
    this.nav.pushView(view);
  }

  public openStoryManage(story: StoryMetadata): void {
    const view = new StoryManageView(
      story,
      (st: StoryMetadata) => this.openChapters(st),
      (st: StoryMetadata) => this.writeNewChapter(st),
      () => this.nav.popView()
    );
    this.nav.pushView(view);
  }

  public openChapters(story: StoryMetadata): void {
    const view = new ChapterListView(
      story,
      (st, chapter) => this.editChapter(st, chapter),
      (st) => this.writeNewChapter(st),
      () => this.nav.popView()
    );
    this.nav.pushView(view);
  }

  public editChapter(story: StoryMetadata, chapter: ChapterMetadata): void {
    const content = ChapterService.getChapterContent(chapter.filePath);
    const editor = new ChapterEditor(story.title, chapter, content, () => this.nav.popView());
    this.nav.pushView(editor);
  }

  public writeNewChapter(story: StoryMetadata): void {
    const newChap = ChapterService.createNewChapter(story.title || story.id, `Capítulo ${story.totalChapters + 1}`);
    story.totalChapters++;
    this.editChapter(story, newChap);
  }

  public logout(): void {
    SessionManager.logout();
    this.nav.setRoot(this.createWelcomeView());
  }
}
