import readline from 'readline';
import { ResponsiveManager, ResponsiveLayoutConfig } from './responsive';
import { Theme, Chalk, padEndVisible, stripAnsi } from './theme';
import { ThemeManager } from './theme-manager';
import { TerminalAdapter } from './terminal-adapter';
import { Header, HeaderProps } from './components/header';
import { CommandInput } from './components/command-input';
import { SuggestionsDropdown } from './components/suggestions';
import { StatusBar } from './components/status-bar';
import { CommandOutput, OutputViewProps } from './components/command-output';
import { HomeView } from './components/home-view';
import { Story, RemoteWattpadStory, LocalManuscript } from '../../features/stories/types/story.types';
import { Chapter } from '../../features/chapters/types/chapter.types';
import { WattpadUser } from '../../features/account/types/account.types';
import { CommandRegistry } from '../../features/commands/command-registry';
import { CommandHistory } from '../../features/commands/history';
import { CommandResult, Suggestion } from '../../core/types/command.types';

export class AppShell {
  private inputValue: string = '';
  private cursorIndex: number = 0;
  private suggestions: Suggestion[] = [];
  private selectedSuggestionIndex: number = 0;

  private latestOutput: OutputViewProps | null = null;
  private notificationMessage: string | null = null;
  private notificationTimer?: any;

  private stories: Story[] = [];
  private chapters: Chapter[] = [];
  private remoteStories: RemoteWattpadStory[] = [];
  private localManuscripts: LocalManuscript[] = [];
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
  ) {}

  public setCommandExecutor(executor: (cmd: string) => Promise<CommandResult>): void {
    this.onCommandExecute = executor;
  }

  // Compatibilidad hacia atrás
  public setTokenSubmitHandler(_handler: any): void {}
  public openAuthModal(_onTokenSubmit?: any): void {}
  public closeAuthModal(): void {}

  public switchView(_viewName?: string): void {
    if (this.isRunning) this.render();
  }

  public setNotification(msg: string | null): void {
    this.notificationMessage = msg;
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
      this.notificationTimer = undefined;
    }
    if (msg) {
      this.notificationTimer = setTimeout(() => {
        this.notificationMessage = null;
        if (this.isRunning) this.render();
      }, 5000);
    }
    if (this.isRunning) this.render();
  }

  public setState(props: {
    stories?: Story[];
    chapters?: Chapter[];
    remoteStories?: RemoteWattpadStory[];
    localManuscripts?: LocalManuscript[];
    currentUser?: WattpadUser | null;
    activeStoryId?: string | null;
    activeChapterId?: string | null;
    serverOnline?: boolean;
    serverUrl?: string;
    version?: string;
  }): void {
    if (props.stories !== undefined) this.stories = props.stories;
    if (props.chapters !== undefined) this.chapters = props.chapters;
    if (props.remoteStories !== undefined) this.remoteStories = props.remoteStories;
    if (props.localManuscripts !== undefined) this.localManuscripts = props.localManuscripts;
    if (props.currentUser !== undefined) this.currentUser = props.currentUser;
    if (props.activeStoryId !== undefined) this.activeStoryId = props.activeStoryId;
    if (props.activeChapterId !== undefined) this.activeChapterId = props.activeChapterId;
    if (props.serverOnline !== undefined) this.serverOnline = props.serverOnline;
    if (props.serverUrl !== undefined) this.serverUrl = props.serverUrl;
    if (props.version !== undefined) this.version = props.version;

    if (this.isRunning) {
      this.render();
    }
  }

  public async start(): Promise<void> {
    this.isRunning = true;

    // Configurar adaptador de terminal e inicializar sesión limpia
    TerminalAdapter.enterSession();

    // Suscribir eventos de redimensionamiento
    this.resizeUnsubscribe = ResponsiveManager.onResize(() => {
      this.render();
    });

    try {
      readline.emitKeypressEvents(process.stdin);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
      }
      process.stdin.resume();

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

    // Salir de forma segura con Ctrl+C o Ctrl+D
    if ((key.ctrl && key.name === 'c') || (key.ctrl && key.name === 'd')) {
      if (this.inputValue.length > 0) {
        // Si hay texto escrito, cancelar el comando actual limpiando la caja
        this.inputValue = '';
        this.cursorIndex = 0;
        this.suggestions = [];
        this.render();
        return;
      }
      this.exit();
      process.exit(0);
      return;
    }

    // Escape para cerrar sugerencias
    if (key.name === 'escape') {
      if (this.suggestions.length > 0) {
        this.suggestions = [];
        this.render();
        return;
      }
      if (this.latestOutput) {
        this.latestOutput = null;
        this.render();
        return;
      }
      this.render();
      return;
    }

    // Tab para autocompletar sugerencia
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

    // Flecha Arriba
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

    // Flecha Abajo
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

    // Enter para ejecutar comando o seleccionar sugerencia
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

    // Flecha Izquierda
    if (key.name === 'left') {
      if (this.cursorIndex > 0) {
        this.cursorIndex--;
        this.render();
      }
      return;
    }

    // Flecha Derecha
    if (key.name === 'right') {
      if (this.cursorIndex < this.inputValue.length) {
        this.cursorIndex++;
        this.render();
      }
      return;
    }

    // Caracteres regulares
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

    // Comandos especiales de sesión
    if (trimmed === '/clear' || trimmed === '/cls') {
      this.latestOutput = null;
      this.render();
      return;
    }

    if (trimmed === '/exit' || trimmed === '/quit') {
      this.exit();
      process.exit(0);
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

    // Ejecutar mediante router
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
      version: this.version || '1.1.0',
      user: this.currentUser ? this.currentUser.username : 'Sin conectar',
      displayName: this.currentUser?.name,
      isAuthenticated: Boolean(this.currentUser),
      serverUrl: this.serverUrl,
      serverOnline: this.serverOnline,
      activeStory: activeStory ? `${activeStory.title} [${activeStory.id}]` : null,
      activeChapter: activeChapter ? `${activeChapter.title} [${activeChapter.id}]` : null,
    };
    const headerLines = Header.render(headerProps, config);
    output.push(...headerLines);

    // 2. Middle Content Area: Command Output o HomeView moderno
    const inputHeight = 5;
    const suggestionsHeight = this.suggestions.length > 0 ? this.suggestions.slice(0, 5).length + 2 : 0;
    const reservedVertical = headerLines.length + inputHeight + suggestionsHeight + 1;
    const midHeight = Math.max(7, config.height - reservedVertical);

    let viewLines: string[] = [];

    if (this.latestOutput) {
      viewLines = CommandOutput.render(this.latestOutput, config.width);
    } else {
      viewLines = HomeView.render({
        user: this.currentUser,
        isAuthenticated: Boolean(this.currentUser),
        stories: this.stories,
        chapters: this.chapters,
        remoteStories: this.remoteStories,
        localManuscripts: this.localManuscripts,
        activeStoryId: this.activeStoryId,
        recentCommands: this.history.getAll(),
        width: config.width,
      });
    }

    while (viewLines.length < midHeight) {
      viewLines.push('');
    }
    const finalViewLines = viewLines.slice(Math.max(0, viewLines.length - midHeight));
    output.push(...finalViewLines.map((l) => padEndVisible(l, config.width)));

    // 3. Suggestions Dropdown (si el usuario está escribiendo /...)
    if (this.suggestions.length > 0) {
      const sugLines = SuggestionsDropdown.render(this.suggestions, this.selectedSuggestionIndex, config.width);
      output.push(...sugLines);
    }

    // 4. Command Input Box
    const inputLines = CommandInput.render(this.inputValue, this.cursorIndex, config.width, true);
    output.push(...inputLines);

    // Write buffer using TerminalAdapter
    TerminalAdapter.renderBuffer(output.join('\n'));
  }
}
