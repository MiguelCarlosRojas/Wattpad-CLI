import readline from 'readline';
import { ResponsiveManager, ResponsiveLayoutConfig } from './responsive';
import { Theme, Chalk, padEndVisible, stripAnsi } from './theme';
import { ThemeManager } from './theme-manager';
import { TerminalAdapter } from './terminal-adapter';
import { Header, HeaderProps } from './components/header';
import { CommandInput } from './components/command-input';
import { SuggestionsDropdown } from './components/suggestions';
import { StatusBar } from './components/status-bar';
import { AuthModal, AuthModalFocus, AuthModalProps } from './components/auth-modal';
import { CommandOutput, OutputViewProps } from './components/command-output';
import { Story, Chapter, WattpadUser } from '../../shared/types';
import { CommandRegistry } from '../../commands/command-registry';
import { CommandHistory } from '../../commands/history';
import { CommandResult, Suggestion } from '../../types/command.types';
import { openUrlInBrowser } from '../../utils/browser';

export class AppShell {
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
  private version: string = '1.0.0';

  // Authorization Modal State
  private isAuthModalOpen: boolean = false;
  private modalTokenInput: string = '';
  private modalFocus: AuthModalFocus = 'token';
  private modalStatus: 'waiting' | 'verifying' | 'success' | 'error' = 'waiting';
  private modalErrorMessage?: string;
  private onTokenSubmit?: (token: string) => Promise<{ success: boolean; user?: WattpadUser; error?: string }>;

  private resizeUnsubscribe?: () => void;
  private exitResolver?: () => void;
  private isRunning: boolean = false;

  private onCommandExecute?: (cmd: string) => Promise<CommandResult>;

  constructor(
    private registry: CommandRegistry,
    private history: CommandHistory
  ) {}

  public setCommandExecutor(executor: (cmd: string) => Promise<CommandResult>): void {
    this.onCommandExecute = executor;
  }

  public setTokenSubmitHandler(handler: (token: string) => Promise<{ success: boolean; user?: WattpadUser; error?: string }>): void {
    this.onTokenSubmit = handler;
  }

  public openAuthModal(onTokenSubmit?: (token: string) => Promise<{ success: boolean; user?: WattpadUser; error?: string }>): void {
    this.isAuthModalOpen = true;
    this.modalTokenInput = '';
    this.modalFocus = 'token';
    this.modalStatus = 'waiting';
    this.modalErrorMessage = undefined;
    if (onTokenSubmit) this.onTokenSubmit = onTokenSubmit;
    if (this.isRunning) this.render();
  }

  public closeAuthModal(): void {
    this.isAuthModalOpen = false;
    this.modalTokenInput = '';
    this.modalErrorMessage = undefined;
    if (this.isRunning) this.render();
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
    if (props.stories !== undefined) this.stories = props.stories;
    if (props.chapters !== undefined) this.chapters = props.chapters;
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
    if (this.isRunning) this.render();
  }

  public switchView(view?: string): void {
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

    // --- MODAL INTERACTION ---
    if (this.isAuthModalOpen) {
      if (key.name === 'escape') {
        this.closeAuthModal();
        return;
      }

      if (key.name === 'tab') {
        if (this.modalFocus === 'token') this.modalFocus = 'connect';
        else if (this.modalFocus === 'connect') this.modalFocus = 'cancel';
        else this.modalFocus = 'token';
        this.render();
        return;
      }

      if (key.name === 'left' || key.name === 'right') {
        if (this.modalFocus === 'connect') this.modalFocus = 'cancel';
        else if (this.modalFocus === 'cancel') this.modalFocus = 'connect';
        this.render();
        return;
      }

      if (key.name === 'return') {
        if (this.modalFocus === 'cancel') {
          this.closeAuthModal();
          return;
        }

        const token = this.modalTokenInput.trim();
        if (!token) {
          this.modalErrorMessage = 'Introduce un token autorizado.';
          this.modalStatus = 'error';
          this.render();
          return;
        }

        this.modalStatus = 'verifying';
        this.render();

        if (this.onTokenSubmit) {
          this.onTokenSubmit(token)
            .then((res) => {
              if (res.success && res.user) {
                this.currentUser = res.user;
                this.modalStatus = 'success';
                this.render();
                setTimeout(() => {
                  this.closeAuthModal();
                }, 1400);
              } else {
                this.modalStatus = 'error';
                this.modalErrorMessage = res.error || 'Credencial no autorizada por Wattpad';
                this.render();
              }
            })
            .catch((err) => {
              this.modalStatus = 'error';
              this.modalErrorMessage = err?.message || 'Error de verificación';
              this.render();
            });
        }
        return;
      }

      if (key.name === 'backspace') {
        if (this.modalTokenInput.length > 0) {
          this.modalTokenInput = this.modalTokenInput.slice(0, -1);
          this.modalStatus = 'waiting';
          this.render();
        }
        return;
      }

      if (str && !key.ctrl && !key.meta && str.length === 1) {
        this.modalTokenInput += str;
        this.modalStatus = 'waiting';
        this.render();
      }
      return;
    }

    // --- MAIN SCREEN INTERACTION ---
    if (key.name === 'escape') {
      if (this.suggestions.length > 0) {
        this.suggestions = [];
        this.render();
        return;
      }
      this.render();
      return;
    }

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
      return;
    }

    if (key.name === 'up') {
      if (this.suggestions.length > 0) {
        if (this.selectedSuggestionIndex > 0) this.selectedSuggestionIndex--;
        this.render();
        return;
      }
      const prev = this.history.navigateUp(this.inputValue);
      if (prev !== null) {
        this.inputValue = prev;
        this.cursorIndex = prev.length;
        this.render();
      }
      return;
    }

    if (key.name === 'down') {
      if (this.suggestions.length > 0) {
        if (this.selectedSuggestionIndex < this.suggestions.length - 1) this.selectedSuggestionIndex++;
        this.render();
        return;
      }
      const next = this.history.navigateDown();
      if (next !== null) {
        this.inputValue = next;
        this.cursorIndex = next.length;
        this.render();
      }
      return;
    }

    if (key.name === 'return') {
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

    if (key.name === 'backspace') {
      if (this.cursorIndex > 0) {
        this.inputValue = this.inputValue.slice(0, this.cursorIndex - 1) + this.inputValue.slice(this.cursorIndex);
        this.cursorIndex--;
        this.updateSuggestions();
        this.render();
      }
      return;
    }

    if (key.name === 'left') {
      if (this.cursorIndex > 0) {
        this.cursorIndex--;
        this.render();
      }
      return;
    }

    if (key.name === 'right') {
      if (this.cursorIndex < this.inputValue.length) {
        this.cursorIndex++;
        this.render();
      }
      return;
    }

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
      this.render();
      return;
    }

    // Modal trigger: /login without arguments opens modal in interactive mode
    if (trimmed === '/login') {
      openUrlInBrowser('https://www.wattpad.com/login').catch(() => {});
      this.openAuthModal();
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
      this.latestOutput = {
        command: trimmed,
        result: {
          success: false,
          message: `Comando no reconocido: "${trimmed}". Utiliza / para autocompletar o escribe /help para ver la lista de comandos disponibles.`,
        },
      };
      this.render();
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
        this.render();
      } catch (err: any) {
        this.latestOutput = {
          command: trimmed,
          result: {
            success: false,
            message: `Error al ejecutar comando: ${err?.message || err}`,
          },
        };
        this.render();
      }
    }
  }

  public render(): void {
    const config = ResponsiveManager.getLayoutConfig();
    const output: string[] = [];

    const activeStory = this.stories.find((s) => s.id === this.activeStoryId) || null;
    const activeChapter = this.chapters.find((c) => c.id === this.activeChapterId) || null;

    // 1. Compact Brand Header
    const headerProps: HeaderProps = {
      version: this.version || '1.0.0',
      user: this.currentUser ? this.currentUser.username : 'Sin conectar',
      isAuthenticated: Boolean(this.currentUser),
      serverUrl: this.serverUrl,
      serverOnline: this.serverOnline,
      activeStory: activeStory ? `${activeStory.title} [${activeStory.id}]` : null,
      activeChapter: activeChapter ? `${activeChapter.title} [${activeChapter.id}]` : null,
    };
    const headerLines = Header.render(headerProps, config);
    output.push(...headerLines);

    // 2. Middle Content Area (Output or Modal or Clean Greeting)
    const inputHeight = 5;
    const suggestionsHeight = this.suggestions.length > 0 && !this.isAuthModalOpen ? this.suggestions.slice(0, 5).length + 2 : 0;
    const reservedVertical = headerLines.length + inputHeight + suggestionsHeight;
    const midHeight = Math.max(6, config.height - reservedVertical);

    let viewLines: string[] = [];

    if (this.isAuthModalOpen) {
      viewLines = AuthModal.render(
        {
          isOpen: true,
          tokenValue: this.modalTokenInput,
          focus: this.modalFocus,
          status: this.modalStatus,
          errorMessage: this.modalErrorMessage,
          authenticatedUser: this.currentUser,
        },
        config.width
      );
    } else if (this.latestOutput) {
      viewLines = CommandOutput.render(this.latestOutput, config.width);
    } else {
      viewLines.push('');
      viewLines.push(Chalk.dim('  Bienvenido a Wattpad CLI. Administra tus novelas, capítulos y publicaciones.'));
      viewLines.push(
        Chalk.dim('  Escribe ') +
          Chalk.hex(Theme.colors.primary, '/') +
          Chalk.dim(' para ver los comandos disponibles o ') +
          Chalk.hex(Theme.colors.primary, '/login') +
          Chalk.dim(' para conectar tu cuenta.')
      );
    }

    while (viewLines.length < midHeight) {
      viewLines.push('');
    }
    const finalViewLines = viewLines.slice(Math.max(0, viewLines.length - midHeight));
    output.push(...finalViewLines.map((l) => padEndVisible(l, config.width)));

    // 3. Suggestions Dropdown (if user typing /...)
    if (this.suggestions.length > 0 && !this.isAuthModalOpen) {
      const sugLines = SuggestionsDropdown.render(this.suggestions, this.selectedSuggestionIndex, config.width);
      output.push(...sugLines);
    }

    // 4. Command Input Box
    const isInputFocused = !this.isAuthModalOpen;
    const inputLines = CommandInput.render(this.inputValue, this.cursorIndex, config.width, isInputFocused);
    output.push(...inputLines);

    // Write buffer using TerminalAdapter
    TerminalAdapter.renderBuffer(output.join('\n'));
  }
}

