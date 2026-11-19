import readline from 'readline';
import { ResponsiveManager, ResponsiveLayoutConfig } from './responsive';
import { Theme, Chalk, padEndVisible, stripAnsi } from './theme';
import { ThemeManager } from './theme-manager';
import { TerminalAdapter } from './terminal-adapter';
import { Header, HeaderProps } from './components/header';
import { WorkspaceNavigation, NAV_ITEMS } from './components/workspace-navigation';
import { CommandInput } from './components/command-input';
import { SuggestionsDropdown } from './components/suggestions';
import { StatusBar } from './components/status-bar';
import { HomeView } from './views/home-view';
import { LibraryView } from './views/library-view';
import { ChapterView } from './views/chapter-view';
import { DocumentsView } from './views/documents-view';
import { CommandOutputView, OutputViewProps } from './views/output-view';
import { Story, Chapter, WattpadUser } from '../../shared/types';
import { CommandRegistry } from '../../commands/command-registry';
import { CommandHistory } from '../../commands/history';
import { CommandResult, Suggestion } from '../../types/command.types';

export type ActiveView = 'home' | 'library' | 'chapters' | 'documents' | 'output' | 'models' | 'conversation';
export type FocusArea = 'input' | 'navigation' | 'view';

export class AppShell {
  private activeView: ActiveView = 'home';
  private focusArea: FocusArea = 'input';
  private navigation: WorkspaceNavigation;

  private inputValue: string = '';
  private cursorIndex: number = 0;
  private suggestions: Suggestion[] = [];
  private selectedSuggestionIndex: number = 0;

  private selectedStoryIndex: number = 0;
  private selectedChapterIndex: number = 0;

  private latestOutput: OutputViewProps | null = null;
  private notificationMessage: string | null = null;
  private notificationTimer?: any;

  private stories: Story[] = [];
  private chapters: Chapter[] = [];
  private currentUser: WattpadUser | null = null;
  private activeStoryId: string | null = null;
  private activeChapterId: string | null = null;
  private serverOnline: boolean = true;
  private serverUrl: string = 'https://wattpad-cli.onrender.com';
  private version: string = '1.1.0';

  private resizeUnsubscribe?: () => void;
  private exitResolver?: () => void;
  private isRunning: boolean = false;

  private onCommandExecute?: (cmd: string) => Promise<CommandResult>;

  constructor(
    private registry: CommandRegistry,
    private history: CommandHistory
  ) {
    this.navigation = new WorkspaceNavigation('home');
  }

  public setCommandExecutor(executor: (cmd: string) => Promise<CommandResult>): void {
    this.onCommandExecute = executor;
  }

  public setState(props: {
    stories?: Story[];
    chapters?: Chapter[];
    currentUser?: WattpadUser | null;
    activeStoryId?: string | null;
    activeChapterId?: string | null;
    serverOnline?: boolean;
    serverUrl?: string;
    version?: string;
  }): void {
    if (props.stories) this.stories = props.stories;
    if (props.chapters) this.chapters = props.chapters;
    if (props.currentUser !== undefined) this.currentUser = props.currentUser;
    if (props.activeStoryId !== undefined) this.activeStoryId = props.activeStoryId;
    if (props.activeChapterId !== undefined) this.activeChapterId = props.activeChapterId;
    if (props.serverOnline !== undefined) this.serverOnline = props.serverOnline;
    if (props.serverUrl) this.serverUrl = props.serverUrl;
    if (props.version) this.version = props.version;

    if (this.isRunning) {
      this.render();
    }
  }

  public showNotification(msg: string, durationMs: number = 3000): void {
    this.notificationMessage = msg;
    if (this.notificationTimer) clearTimeout(this.notificationTimer);
    this.notificationTimer = setTimeout(() => {
      this.notificationMessage = null;
      if (this.isRunning) this.render();
    }, durationMs);
    if (this.isRunning) this.render();
  }

  public addMessage(sender: 'user' | 'assistant' | 'system', content: string): void {
    this.latestOutput = {
      command: sender === 'user' ? content : 'Wattpad CLI',
      result: {
        success: true,
        message: content,
      },
    };
    this.activeView = 'output';
    if (this.isRunning) this.render();
  }

  public switchView(view: ActiveView): void {
    if (view === 'models') {
      this.activeView = 'home';
      this.navigation.selectById('home');
    } else if (view === 'conversation') {
      this.activeView = 'output';
    } else {
      this.activeView = view;
      if (view === 'home') this.navigation.selectById('home');
      if (view === 'library') this.navigation.selectById('stories');
      if (view === 'chapters') this.navigation.selectById('chapters');
      if (view === 'documents') this.navigation.selectById('documents');
    }

    if (this.isRunning) this.render();
  }

  public getChaptersCountMap(): Record<string, number> {
    const map: Record<string, number> = {};
    for (const c of this.chapters) {
      map[c.storyId] = (map[c.storyId] || 0) + 1;
    }
    return map;
  }

  public async start(): Promise<void> {
    this.isRunning = true;

    // Listen for terminal resize
    this.resizeUnsubscribe = ResponsiveManager.onResize(() => {
      if (this.isRunning) this.render();
    });

    const isTTY = Boolean(process.stdin && process.stdin.isTTY);

    if (!isTTY) {
      // Non-interactive fallback: render once and exit cleanly
      this.render();
      return;
    }

    // Set up interactive raw terminal session
    try {
      TerminalAdapter.enterSession();

      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(true);
      }
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      readline.emitKeypressEvents(process.stdin);
      process.stdin.on('keypress', (str: string, key: readline.Key) => {
        this.handleKeyPress(str, key);
      });

      this.render();
    } catch {
      this.render();
      return;
    }

    return new Promise<void>((resolve) => {
      this.exitResolver = resolve;
    });
  }

  public exit(): void {
    this.isRunning = false;

    if (this.resizeUnsubscribe) {
      this.resizeUnsubscribe();
      this.resizeUnsubscribe = undefined;
    }

    if (process.stdin.setRawMode) {
      try {
        process.stdin.setRawMode(false);
      } catch {}
    }
    try {
      process.stdin.pause();
    } catch {}

    // Restore terminal session using adapter
    TerminalAdapter.leaveSession();

    if (this.exitResolver) {
      this.exitResolver();
    }
  }

  private handleKeyPress(str: string, key?: readline.Key): void {
    if (!key) return;

    // Exit shortcuts: Ctrl+C or Ctrl+D
    if ((key.ctrl && key.name === 'c') || (key.ctrl && key.name === 'd')) {
      this.exit();
      process.exit(0);
      return;
    }

    // Escape: Return to home view or clear suggestions
    if (key.name === 'escape') {
      if (this.suggestions.length > 0) {
        this.suggestions = [];
        this.render();
        return;
      }
      if (this.activeView !== 'home') {
        this.switchView('home');
        return;
      }
      this.focusArea = 'input';
      this.render();
      return;
    }

    // Tab: Switch focus area (input <-> navigation/view)
    if (key.name === 'tab') {
      if (this.suggestions.length > 0) {
        const picked = this.suggestions[this.selectedSuggestionIndex];
        if (picked) {
          this.inputValue = picked.command;
          this.cursorIndex = this.inputValue.length;
          this.suggestions = [];
          this.render();
          return;
        }
      }

      if (this.focusArea === 'input') {
        this.focusArea = 'view';
      } else if (this.focusArea === 'view') {
        this.focusArea = 'navigation';
      } else {
        this.focusArea = 'input';
      }
      this.render();
      return;
    }

    // Up Arrow
    if (key.name === 'up') {
      if (this.suggestions.length > 0) {
        if (this.selectedSuggestionIndex > 0) this.selectedSuggestionIndex--;
        this.render();
        return;
      }
      if (this.focusArea === 'navigation') {
        this.navigation.navigateUp();
        this.render();
        return;
      }
      if (this.focusArea === 'view') {
        if (this.activeView === 'home' || this.activeView === 'library') {
          if (this.selectedStoryIndex > 0) this.selectedStoryIndex--;
        } else if (this.activeView === 'chapters') {
          if (this.selectedChapterIndex > 0) this.selectedChapterIndex--;
        }
        this.render();
        return;
      }
      if (this.focusArea === 'input') {
        const prev = this.history.navigateUp(this.inputValue);
        if (prev !== null) {
          this.inputValue = prev;
          this.cursorIndex = prev.length;
          this.render();
        }
        return;
      }
    }

    // Down Arrow
    if (key.name === 'down') {
      if (this.suggestions.length > 0) {
        if (this.selectedSuggestionIndex < this.suggestions.length - 1) this.selectedSuggestionIndex++;
        this.render();
        return;
      }
      if (this.focusArea === 'navigation') {
        this.navigation.navigateDown();
        this.render();
        return;
      }
      if (this.focusArea === 'view') {
        if (this.activeView === 'home' || this.activeView === 'library') {
          if (this.selectedStoryIndex < this.stories.length - 1) this.selectedStoryIndex++;
        } else if (this.activeView === 'chapters') {
          const chaps = this.getFilteredChapters();
          if (this.selectedChapterIndex < chaps.length - 1) this.selectedChapterIndex++;
        }
        this.render();
        return;
      }
      if (this.focusArea === 'input') {
        const next = this.history.navigateDown();
        if (next !== null) {
          this.inputValue = next;
          this.cursorIndex = next.length;
          this.render();
        }
        return;
      }
    }

    // Enter Key
    if (key.name === 'return') {
      if (this.focusArea === 'navigation') {
        const item = this.navigation.getSelectedItem();
        this.executeCommandString(item.command);
        return;
      }

      if (this.focusArea === 'view') {
        if (this.activeView === 'home' || this.activeView === 'library') {
          const story = this.stories[this.selectedStoryIndex];
          if (story) {
            this.activeStoryId = story.id;
            this.showNotification(`Novela seleccionada: ${story.title} [${story.id}]`);
            this.switchView('chapters');
          }
        } else if (this.activeView === 'chapters') {
          const chaps = this.getFilteredChapters();
          const chap = chaps[this.selectedChapterIndex];
          if (chap) {
            this.activeChapterId = chap.id;
            this.executeCommandString(`/chapter open ${chap.storyId} ${chap.id}`);
          }
        } else if (this.activeView === 'output') {
          this.switchView('home');
        }
        return;
      }

      // Input Enter
      const cmd = this.inputValue.trim();
      this.inputValue = '';
      this.cursorIndex = 0;
      this.suggestions = [];
      if (cmd.length > 0) {
        this.history.push(cmd);
        this.executeCommandString(cmd);
      }
      return;
    }

    // Backspace
    if (key.name === 'backspace') {
      if (this.cursorIndex > 0) {
        this.inputValue = this.inputValue.slice(0, this.cursorIndex - 1) + this.inputValue.slice(this.cursorIndex);
        this.cursorIndex--;
        this.updateSuggestions();
        this.render();
      }
      return;
    }

    // Left Arrow
    if (key.name === 'left') {
      if (this.cursorIndex > 0) {
        this.cursorIndex--;
        this.render();
      }
      return;
    }

    // Right Arrow
    if (key.name === 'right') {
      if (this.cursorIndex < this.inputValue.length) {
        this.cursorIndex++;
        this.render();
      }
      return;
    }

    // Standard character typing
    if (str && !key.ctrl && !key.meta) {
      this.inputValue = this.inputValue.slice(0, this.cursorIndex) + str + this.inputValue.slice(this.cursorIndex);
      this.cursorIndex += str.length;
      this.updateSuggestions();
      this.render();
    }
  }

  private updateSuggestions(): void {
    if (this.inputValue.startsWith('/')) {
      const q = this.inputValue.toLowerCase();
      this.suggestions = this.registry
        .getAll()
        .filter((c) => c.name.toLowerCase().startsWith(q))
        .map((c) => ({
          command: c.name,
          description: c.description,
          category: c.category || 'General',
        }));
      this.selectedSuggestionIndex = 0;
    } else {
      this.suggestions = [];
    }
  }

  private async executeCommandString(raw: string): Promise<void> {
    const trimmed = raw.trim();
    if (!trimmed) return;

    if (trimmed === '/exit') {
      this.exit();
      process.exit(0);
      return;
    }

    if (trimmed === '/clear' || trimmed === '/home') {
      this.latestOutput = null;
      this.switchView('home');
      return;
    }

    if (trimmed === '/stories' || trimmed === '/library') {
      this.switchView('library');
      return;
    }

    if (trimmed.startsWith('/chapters')) {
      this.switchView('chapters');
      return;
    }

    if (trimmed === '/documents') {
      this.switchView('documents');
      return;
    }

    if (trimmed.startsWith('/theme')) {
      const parts = trimmed.split(' ');
      const themeArg = parts[1] as any;
      if (themeArg && ThemeManager.getAvailableThemes().includes(themeArg)) {
        ThemeManager.setTheme(themeArg);
        this.showNotification(`Tema activado: ${themeArg}`);
      } else {
        this.showNotification(`Temas: ${ThemeManager.getAvailableThemes().join(', ')}`);
      }
      return;
    }

    if (trimmed.startsWith('/mode')) {
      const parts = trimmed.split(' ');
      const modeArg = parts[1] as any;
      if (modeArg === 'inline' || modeArg === 'fullscreen') {
        TerminalAdapter.setMode(modeArg);
        this.showNotification(`Modo de renderizado: ${modeArg}`);
      } else {
        this.showNotification(`Modos: fullscreen, inline`);
      }
      return;
    }

    if (!trimmed.startsWith('/')) {
      this.showNotification(`Comando desconocido: "${trimmed}". Escribe /help para ver la lista de comandos.`);
      return;
    }

    // Execute via command router
    if (this.onCommandExecute) {
      try {
        const res = await this.onCommandExecute(trimmed);
        this.latestOutput = {
          command: trimmed,
          result: res,
        };
        this.switchView('output');
      } catch (err: any) {
        this.latestOutput = {
          command: trimmed,
          result: {
            success: false,
            message: `Error al ejecutar comando: ${err?.message || err}`,
          },
        };
        this.switchView('output');
      }
    }
  }

  private getFilteredChapters(): Chapter[] {
    const storyId = this.activeStoryId || (this.stories[0]?.id || 'NOV-0001');
    return this.chapters.filter((c) => c.storyId === storyId);
  }

  public render(): void {
    const config = ResponsiveManager.getLayoutConfig();
    const output: string[] = [];

    const activeStory = this.stories.find((s) => s.id === this.activeStoryId) || null;
    const activeChapter = this.chapters.find((c) => c.id === this.activeChapterId) || null;

    // 1. Header Bar
    const headerProps: HeaderProps = {
      version: this.version,
      user: this.currentUser ? this.currentUser.username : 'wattpad_author',
      isAuthenticated: Boolean(this.currentUser),
      serverUrl: this.serverUrl,
      serverOnline: this.serverOnline,
      activeStory: activeStory ? `${activeStory.title} [${activeStory.id}]` : null,
      activeChapter: activeChapter ? `${activeChapter.title} [${activeChapter.id}]` : null,
    };
    const headerLines = Header.render(headerProps, config);
    output.push(...headerLines);

    // 2. Fixed lines reserved: Header (~2), Input (~2), StatusBar (1) = 5
    const reservedVertical = headerLines.length + 3;
    const midHeight = Math.max(6, config.height - reservedVertical);

    // 3. Render Active Center View
    let viewLines: string[] = [];
    const mainWidth = config.mainWidth;

    if (this.activeView === 'home') {
      viewLines = HomeView.render(
        {
          stories: this.stories,
          chaptersCountByStoryId: this.getChaptersCountMap(),
          selectedIndex: this.focusArea === 'view' ? this.selectedStoryIndex : -1,
          user: this.currentUser ? this.currentUser.username : null,
          isAuthenticated: Boolean(this.currentUser),
        },
        mainWidth
      );
    } else if (this.activeView === 'library') {
      viewLines = LibraryView.render(
        {
          stories: this.stories,
          selectedIndex: this.selectedStoryIndex,
          chaptersCountByStoryId: this.getChaptersCountMap(),
        },
        mainWidth
      );
    } else if (this.activeView === 'chapters') {
      const story = activeStory || this.stories[0] || {
        id: 'NOV-0001',
        title: 'Mi Novela',
        userId: 'usr_01',
        wattpadId: null,
        description: '',
        coverUrl: null,
        genre: 'General',
        category: 'Novela',
        tags: [],
        language: 'es',
        mature: false,
        editorPreference: 'word',
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      viewLines = ChapterView.render(
        {
          story,
          chapters: this.getFilteredChapters(),
          selectedIndex: this.selectedChapterIndex,
        },
        mainWidth
      );
    } else if (this.activeView === 'documents') {
      viewLines = DocumentsView.render(
        {
          stories: this.stories,
          chapters: this.chapters,
          wordConnected: true,
          notepadConnected: true,
          googleConnected: false,
        },
        mainWidth
      );
    } else if (this.activeView === 'output' && this.latestOutput) {
      viewLines = CommandOutputView.render(this.latestOutput, mainWidth);
    } else {
      // Fallback to home
      viewLines = HomeView.render(
        {
          stories: this.stories,
          chaptersCountByStoryId: this.getChaptersCountMap(),
          selectedIndex: -1,
          user: this.currentUser ? this.currentUser.username : null,
          isAuthenticated: Boolean(this.currentUser),
        },
        mainWidth
      );
    }

    // Pad or slice view lines to fit midHeight
    while (viewLines.length < midHeight) {
      viewLines.push('');
    }
    const finalViewLines = viewLines.slice(0, midHeight);

    // 4. Distraction-Free Focused Studio Layout (Single Canvas Experience)
    output.push(...finalViewLines.map((l) => padEndVisible(l, config.width)));

    // 5. Suggestions Overlay (if user typing /...)
    if (this.suggestions.length > 0) {
      const sugLines = SuggestionsDropdown.render(this.suggestions, this.selectedSuggestionIndex, config.width);
      output.push(...sugLines);
    }

    // 6. Command Input Line
    const isInputFocused = this.focusArea === 'input';
    const inputLines = CommandInput.render(this.inputValue, this.cursorIndex, config.width, isInputFocused);
    output.push(...inputLines);

    // 7. Status Bar
    const statusLines = StatusBar.render(config, this.notificationMessage);
    output.push(...statusLines);

    // Write buffer using TerminalAdapter (Supports Fullscreen & Inline modes)
    TerminalAdapter.renderBuffer(output.join('\n'));
  }
}
