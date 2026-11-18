import { ResponsiveManager, ResponsiveLayoutConfig } from './responsive';
import { FocusManager, SelectorItem } from './focus-manager';
import { HeaderBarRenderer, CloudHeaderState } from './components/header-bar';
import { StatusBarRenderer } from './components/status-bar';
import { BlockCardRenderer } from './components/block-card';
import { SelectorList } from './components/selector-list';
import { InputBoxRenderer } from './components/input-box';
import { SuggestionsDropdown } from './components/suggestions';
import { Theme, Chalk, padEndVisible, stripAnsi } from './theme';
import { CommandRegistry } from '../../commands/command-registry';
import { CommandHistory } from '../../commands/history';
import { CommandResult, RenderBlock, Suggestion } from '../../types/command.types';
import { AppShell } from './app-shell';

export class TerminalRenderer {
  private contentLines: string[] = [];
  private currentInput: string = '';
  private cursorIndex: number = 0;
  private suggestions: Suggestion[] = [];
  private selectedSuggestionIndex: number = 0;

  private focusManager: FocusManager;
  private activeSelector: SelectorList | null = null;
  private history: CommandHistory;
  private isRunning: boolean = false;
  private resizeUnsubscribe?: () => void;
  public appShell: AppShell;

  private latestHeaderState: CloudHeaderState = {
    version: '1.0.0',
    user: 'wattpad_author',
    isAuthenticated: true,
    serverUrl: 'https://wattpad-cli.onrender.com',
    serverOnline: true,
    syncState: 'Al día',
  };

  private onCommandSubmit?: (cmd: string) => Promise<CommandResult>;
  private onSelectorSubmit?: (item: SelectorItem) => Promise<CommandResult | void>;

  constructor(
    private registry: CommandRegistry,
    history?: CommandHistory
  ) {
    this.history = history || new CommandHistory();
    this.focusManager = new FocusManager();
    this.appShell = new AppShell(this.registry, this.history);
  }

  public setSubmitHandler(handler: (cmd: string) => Promise<CommandResult>): void {
    this.onCommandSubmit = handler;
    this.appShell.setCommandExecutor(handler);
  }

  public setSelectorSubmitHandler(handler: (item: SelectorItem) => Promise<CommandResult | void>): void {
    this.onSelectorSubmit = handler;
  }

  public showSelector(title: string, items: SelectorItem[]): void {
    this.activeSelector = new SelectorList(title, items);
    this.focusManager.setSelectorActive(true);
    this.renderScreen();
  }

  public clearSelector(): void {
    this.activeSelector = null;
    this.focusManager.setSelectorActive(false);
    this.renderScreen();
  }

  public updateHeaderState(state: Partial<CloudHeaderState>): void {
    this.latestHeaderState = { ...this.latestHeaderState, ...state };
    this.appShell.setState({
      version: this.latestHeaderState.version,
      serverOnline: this.latestHeaderState.serverOnline,
      serverUrl: this.latestHeaderState.serverUrl,
    });
    if (this.isRunning) {
      this.renderScreen();
    }
  }

  public async start(initialHeader: CloudHeaderState): Promise<void> {
    this.isRunning = true;
    this.latestHeaderState = initialHeader;

    this.appShell.setState({
      version: initialHeader.version,
      serverOnline: initialHeader.serverOnline,
      serverUrl: initialHeader.serverUrl,
      activeStoryId: initialHeader.activeStory || null,
      activeChapterId: initialHeader.activeChapter || null,
    });

    // Start AppShell lifecycle
    return await this.appShell.start();
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    this.appShell.exit();
  }

  public addBlocks(blocks: RenderBlock[]): void {
    const config = ResponsiveManager.getLayoutConfig();
    for (const b of blocks) {
      const rendered = BlockCardRenderer.renderBlock(b, config.cardWidth);
      this.contentLines.push(...rendered, '');
      if (b.title || b.content) {
        this.appShell.addMessage('assistant', `${b.title ? b.title + '\n' : ''}${b.content || ''}`);
      }
    }
  }

  public clearContent(): void {
    this.contentLines = [];
  }

  public renderScreen(): void {
    if (this.isRunning) {
      this.appShell.render();
      return;
    }

    const config = ResponsiveManager.getLayoutConfig();
    const output: string[] = [];

    // 1. Header Bar
    const headerLines = HeaderBarRenderer.render(this.latestHeaderState, config);
    output.push(...headerLines);

    // 2. Interactive Selector List (if open)
    let selLines: string[] = [];
    if (this.activeSelector && this.activeSelector.getItems().length > 0) {
      const isSelFocused = this.focusManager.getFocus() === 'selector';
      selLines = this.activeSelector.render(config.cardWidth, isSelFocused);
    }

    // 3. Suggestions List (if active)
    let sugLines: string[] = [];
    if (this.suggestions.length > 0) {
      sugLines = SuggestionsDropdown.render(this.suggestions, this.selectedSuggestionIndex, config.cardWidth);
    }

    // 4. Middle Content Calculations
    const fixedReserved = headerLines.length + 4;
    const midHeight = Math.max(4, config.height - fixedReserved);

    const overlayCount = selLines.length + sugLines.length;
    const maxContentLines = Math.max(2, midHeight - overlayCount);
    const visibleContent = this.contentLines.slice(-maxContentLines);

    const midContentLines: string[] = [
      ...selLines,
      ...sugLines,
      ...visibleContent,
    ];

    while (midContentLines.length < midHeight) {
      midContentLines.push('');
    }
    const finalMidLines = midContentLines.slice(0, midHeight);

    output.push(...finalMidLines);

    // 5. Framed Command Input Box
    const isInputFocused = this.focusManager.getFocus() === 'input';
    const inputLines = InputBoxRenderer.render(this.currentInput, this.cursorIndex, config.width, isInputFocused);
    output.push(...inputLines);

    // 6. Status Bar
    const statusLines = StatusBarRenderer.render(config);
    output.push(...statusLines);

    process.stdout.write('\x1b[H\x1b[2J' + output.join('\n'));
  }
}
