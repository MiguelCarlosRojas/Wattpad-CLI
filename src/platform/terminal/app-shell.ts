import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { ResponsiveManager, ResponsiveLayoutConfig } from './responsive';
import { Theme, Chalk, padEndVisible, stripAnsi } from './theme';
import { TerminalAdapter } from './terminal-adapter';
import { Header, HeaderProps } from './components/header';
import { CommandInput } from './components/command-input';
import { SuggestionsDropdown } from './components/suggestions';
import { StatusBar } from './components/status-bar';
import { CommandOutput, OutputViewProps } from './components/command-output';
import { HomeView } from './components/home-view';
import { CommandPalette } from './components/command-palette';
import { Story, RemoteWattpadStory, LocalManuscript } from '../../features/stories/types/story.types';
import { Chapter } from '../../features/chapters/types/chapter.types';
import { WattpadUser } from '../../features/account/types/account.types';
import { CommandRegistry } from '../../features/commands/command-registry';
import { CommandHistory } from '../../features/commands/history';
import { CommandDefinition, CommandResult, Suggestion } from '../../core/types/command.types';
import { defaultConfig } from '../../core/config/config';

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
  private version: string = '1.2.0';

  // Motor de desplazamiento y vista visual VIPCode
  private viewMode: 'completa' | 'compacta' | 'zen' = 'completa';
  private scrollOffset: number = 0;

  // Paleta de comandos (Ctrl+P)
  private isPaletteOpen: boolean = false;
  private paletteQuery: string = '';
  private paletteSelectedIndex: number = 0;

  private resizeUnsubscribe?: () => void;
  private exitResolver?: () => void;
  private isRunning: boolean = false;

  private onCommandExecute?: (cmd: string) => Promise<CommandResult>;

  constructor(
    private registry: CommandRegistry,
    private history: CommandHistory
  ) {
    this.loadUiConfig();
  }

  private getUiConfigPath(): string {
    const dir = defaultConfig.configDir || path.join(defaultConfig.appDir, 'config');
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {}
    }
    return path.join(dir, 'ui.json');
  }

  private loadUiConfig(): void {
    try {
      const p = this.getUiConfigPath();
      if (fs.existsSync(p)) {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (data.viewMode && ['completa', 'compacta', 'zen'].includes(data.viewMode)) {
          this.viewMode = data.viewMode;
        }
      }
    } catch {}
  }

  private saveUiConfig(): void {
    try {
      const p = this.getUiConfigPath();
      fs.writeFileSync(p, JSON.stringify({ viewMode: this.viewMode }, null, 2), 'utf8');
    } catch {}
  }

  public setViewMode(mode: 'completa' | 'compacta' | 'zen'): void {
    this.viewMode = mode;
    this.saveUiConfig();
    if (this.isRunning) {
      this.render();
    }
  }

  public getViewMode(): 'completa' | 'compacta' | 'zen' {
    return this.viewMode;
  }

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

  private getFilteredPaletteCommands(): CommandDefinition[] {
    const q = this.paletteQuery.trim().toLowerCase().replace(/^\//, '');
    return this.registry.getAll().filter((cmd) => {
      const cleanName = cmd.name.toLowerCase().replace(/^\//, '');
      const desc = (cmd.description || '').toLowerCase();
      const cat = (cmd.category || '').toLowerCase();
      return cleanName.includes(q) || desc.includes(q) || cat.includes(q);
    });
  }

  private handleKeyPress(str: string, key?: readline.Key): void {
    if (!key) return;

    // Salir de forma segura con Ctrl+C o Ctrl+D
    if ((key.ctrl && key.name === 'c') || (key.ctrl && key.name === 'd')) {
      if (this.isPaletteOpen) {
        this.isPaletteOpen = false;
        this.render();
        return;
      }
      if (this.inputValue.length > 0) {
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

    // Toggle de la paleta de comandos con Ctrl+P
    if (key.ctrl && key.name === 'p') {
      this.isPaletteOpen = !this.isPaletteOpen;
      this.paletteQuery = '';
      this.paletteSelectedIndex = 0;
      this.render();
      return;
    }

    // =========================================================================
    // ENTRADA CUANDO LA PALETA DE COMANDOS (Ctrl+P) ESTÁ ABIERTA
    // =========================================================================
    if (this.isPaletteOpen) {
      if (key.name === 'escape') {
        this.isPaletteOpen = false;
        this.render();
        return;
      }

      const filtered = this.getFilteredPaletteCommands();

      if (key.name === 'up') {
        if (this.paletteSelectedIndex > 0) {
          this.paletteSelectedIndex--;
          this.render();
        }
        return;
      }

      if (key.name === 'down') {
        if (this.paletteSelectedIndex < filtered.length - 1) {
          this.paletteSelectedIndex++;
          this.render();
        }
        return;
      }

      if (key.name === 'return') {
        const picked = filtered[this.paletteSelectedIndex];
        this.isPaletteOpen = false;
        if (picked) {
          if (picked.name === '/interface' || picked.usage?.includes('[') || picked.usage?.includes('<')) {
            this.inputValue = `${picked.name} `;
            this.cursorIndex = this.inputValue.length;
          } else {
            this.inputValue = '';
            this.cursorIndex = 0;
            this.executeCommandString(picked.name);
          }
        }
        this.render();
        return;
      }

      if (key.name === 'backspace') {
        if (this.paletteQuery.length > 0) {
          this.paletteQuery = this.paletteQuery.slice(0, -1);
          this.paletteSelectedIndex = 0;
          this.render();
        }
        return;
      }

      if (str && !key.ctrl && !key.meta) {
        this.paletteQuery += str;
        this.paletteSelectedIndex = 0;
        this.render();
        return;
      }

      return;
    }

    // =========================================================================
    // DESPLAZAMIENTO VERTICAL (PageUp / PageDown / Shift+Arrows)
    // =========================================================================
    if (key.name === 'pageup' || (key.ctrl && key.name === 'up')) {
      this.scrollOffset = Math.max(0, this.scrollOffset - 4);
      this.render();
      return;
    }

    if (key.name === 'pagedown' || (key.ctrl && key.name === 'down')) {
      this.scrollOffset += 4;
      this.render();
      return;
    }

    // Escape para cerrar sugerencias o limpiar vista de salida
    if (key.name === 'escape') {
      if (this.suggestions.length > 0) {
        this.suggestions = [];
        this.render();
        return;
      }
      if (this.latestOutput) {
        this.latestOutput = null;
        this.scrollOffset = 0;
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
      this.scrollOffset = 0;
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
      this.scrollOffset = 0;
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
        this.scrollOffset = 0;
        this.render();
      } catch (err: any) {
        this.latestOutput = {
          command: trimmed,
          result: {
            success: false,
            message: `Error al ejecutar comando: ${err?.message || err}`,
          },
        };
        this.scrollOffset = 0;
        this.render();
      }
    }
  }

  public render(): void {
    const config = ResponsiveManager.getLayoutConfig();
    const output: string[] = [];

    const activeStory = this.stories.find((s) => s.id === this.activeStoryId) || null;
    const activeChapter = this.chapters.find((c) => c.id === this.activeChapterId) || null;

    // 1. Fixed Header con Brand Logo y Estado de Conexión
    const headerProps: HeaderProps = {
      version: this.version || '1.2.0',
      user: this.currentUser ? this.currentUser.username : null,
      displayName: this.currentUser?.name,
      isAuthenticated: Boolean(this.currentUser && this.currentUser.username),
      profileVerified: Boolean(this.currentUser && this.currentUser.username),
      serverUrl: this.serverUrl,
      serverOnline: this.serverOnline,
      activeStory: activeStory ? `${activeStory.title} [${activeStory.id}]` : null,
      activeChapter: activeChapter ? `${activeChapter.title} [${activeChapter.id}]` : null,
      mode: this.viewMode,
    };
    const headerLines = Header.render(headerProps, config);
    output.push(...headerLines);

    // 2. Cálculo de alturas de la interfaz soberana
    const inputHeight = 5;
    const statusBarHeight = 1;
    const suggestionsHeight = this.suggestions.length > 0 ? Math.min(6, this.suggestions.length + 2) : 0;
    const reservedVertical = headerLines.length + inputHeight + statusBarHeight + suggestionsHeight + 1;
    const midHeight = Math.max(6, config.height - reservedVertical);

    // 3. Área Central: CommandOutput o HomeView
    let allContentLines: string[] = [];

    if (this.latestOutput) {
      allContentLines = CommandOutput.render(this.latestOutput, config.width);
    } else {
      allContentLines = HomeView.render({
        user: this.currentUser,
        isAuthenticated: Boolean(this.currentUser && this.currentUser.username),
        stories: this.stories,
        chapters: this.chapters,
        remoteStories: this.remoteStories,
        localManuscripts: this.localManuscripts,
        activeStoryId: this.activeStoryId,
        recentCommands: this.history.getAll(),
        width: config.width,
        mode: this.viewMode,
      });
    }

    const totalLines = allContentLines.length;
    let viewportLines: string[] = [];

    if (totalLines <= midHeight) {
      this.scrollOffset = 0;
      viewportLines = [...allContentLines];
      while (viewportLines.length < midHeight) {
        viewportLines.push('');
      }
    } else {
      // Motor de Scroll con indicador vertical estilo VIPCode
      const maxScroll = totalLines - midHeight;
      this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, maxScroll));
      const visibleSlice = allContentLines.slice(this.scrollOffset, this.scrollOffset + midHeight);

      // Scrollbar Thumb
      const thumbHeight = Math.max(1, Math.round((midHeight / totalLines) * midHeight));
      const thumbStart = Math.min(
        midHeight - thumbHeight,
        Math.round((this.scrollOffset / maxScroll) * (midHeight - thumbHeight))
      );

      viewportLines = visibleSlice.map((line, idx) => {
        const isThumb = idx >= thumbStart && idx < thumbStart + thumbHeight;
        const scrollChar = isThumb
          ? Chalk.hex(Theme.colors.primary, '█')
          : Chalk.hex(Theme.colors.surfaceBorder, '░');

        const padded = padEndVisible(line, config.width - 1);
        return padded + scrollChar;
      });
    }

    // Modal Overlay: Paleta de Comandos (Ctrl+P)
    if (this.isPaletteOpen) {
      const paletteLines = CommandPalette.render({
        query: this.paletteQuery,
        selectedIndex: this.paletteSelectedIndex,
        commands: this.registry.getAll(),
        width: config.width,
      });

      const overlayStart = Math.max(0, Math.floor((midHeight - paletteLines.length) / 2));
      for (let i = 0; i < paletteLines.length && overlayStart + i < viewportLines.length; i++) {
        viewportLines[overlayStart + i] = paletteLines[i];
      }
    }

    output.push(...viewportLines.map((l) => padEndVisible(l, config.width)));

    // 4. Suggestions Dropdown (si el usuario está escribiendo /...)
    if (this.suggestions.length > 0) {
      const sugLines = SuggestionsDropdown.render(this.suggestions, this.selectedSuggestionIndex, config.width);
      output.push(...sugLines);
    }

    // 5. Fixed Command Input Box
    const inputLines = CommandInput.render(this.inputValue, this.cursorIndex, config.width, !this.isPaletteOpen);
    output.push(...inputLines);

    // 6. Permanent Bottom Status Bar
    const statusLines = StatusBar.render(config, {
      notification: this.notificationMessage,
      mode: this.viewMode,
    });
    output.push(...statusLines);

    // Write buffer using TerminalAdapter
    TerminalAdapter.renderBuffer(output.join('\n'));
  }
}
