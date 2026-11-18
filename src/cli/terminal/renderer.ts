import { createCliRenderer, CliRenderer, KeyEvent } from '@opentui/core';
import { ResponsiveManager, ResponsiveLayoutConfig } from './responsive';
import { FocusManager, SelectorItem } from './focus-manager';
import { HeaderBarRenderer, CloudHeaderState } from './components/header-bar';
import { StatusBarRenderer } from './components/status-bar';
import { BlockCardRenderer } from './components/block-card';
import { SelectorList } from './components/selector-list';
import { SuggestionListRenderer } from './components/suggestion-list';
import { InputBoxRenderer } from './components/input-box';
import { CommandRegistry } from '../../commands/command-registry';
import { CommandHistory } from '../../commands/history';
import { CommandResult, RenderBlock, Suggestion } from '../../types/command.types';

export class TerminalRenderer {
  private renderer: CliRenderer | null = null;
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

  private latestHeaderState: CloudHeaderState = {
    version: '1.0.0',
    user: 'Local',
    isAuthenticated: false,
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
  }

  public setSubmitHandler(handler: (cmd: string) => Promise<CommandResult>): void {
    this.onCommandSubmit = handler;
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
    if (this.isRunning) {
      this.renderScreen();
    }
  }

  public async start(initialHeader: CloudHeaderState): Promise<void> {
    this.isRunning = true;
    this.latestHeaderState = initialHeader;

    // Listen for terminal resize events dynamically
    this.resizeUnsubscribe = ResponsiveManager.onResize(() => {
      if (this.isRunning) {
        this.renderScreen();
      }
    });

    const isTTY = process.stdin.isTTY && process.stdout.isTTY;
    if (!isTTY) return;

    try {
      this.renderer = await createCliRenderer({
        exitOnCtrlC: false,
      });

      this.renderer.keyInput.on('keypress', async (key: KeyEvent) => {
        await this.handleKeyPress(key);
      });

      this.renderScreen();
    } catch {
      this.renderer = null;
    }
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    if (this.resizeUnsubscribe) {
      this.resizeUnsubscribe();
      this.resizeUnsubscribe = undefined;
    }
    if (this.renderer) {
      try {
        await this.renderer.destroy();
      } catch {}
      this.renderer = null;
    }
    process.stdout.write('\x1b[?25h\x1b[0m\n');
  }

  public addBlocks(blocks: RenderBlock[]): void {
    const config = ResponsiveManager.getLayoutConfig();
    for (const b of blocks) {
      const rendered = BlockCardRenderer.renderBlock(b, config.cardWidth);
      this.contentLines.push(...rendered, '');
    }
  }

  public clearContent(): void {
    this.contentLines = [];
  }

  public renderScreen(): void {
    const config = ResponsiveManager.getLayoutConfig();
    const output: string[] = [];

    // 1. Header Bar
    const headerLines = HeaderBarRenderer.render(this.latestHeaderState, config);
    output.push(...headerLines);

    // 2. Interactive Selector List (if open)
    let selectorLinesCount = 0;
    if (this.activeSelector && this.activeSelector.getItems().length > 0) {
      const isSelFocused = this.focusManager.getFocus() === 'selector';
      const selLines = this.activeSelector.render(config.cardWidth, isSelFocused);
      selectorLinesCount = selLines.length;
      output.push(...selLines);
    }

    // 3. Suggestions List (if active)
    let suggestionsLinesCount = 0;
    if (this.suggestions.length > 0) {
      const sugLines = SuggestionListRenderer.render(this.suggestions, this.selectedSuggestionIndex, config.cardWidth);
      suggestionsLinesCount = sugLines.length;
      output.push(...sugLines);
    }

    // 4. Main Scrollable Content Area
    const fixedReserved = headerLines.length + selectorLinesCount + suggestionsLinesCount + 6;
    const maxContentLines = Math.max(3, config.height - fixedReserved);
    const visibleContent = this.contentLines.slice(-maxContentLines);
    output.push(...visibleContent);

    // Fill remaining vertical space to keep input anchored
    const currentLinesTotal = headerLines.length + selectorLinesCount + suggestionsLinesCount + visibleContent.length;
    const blankNeeded = Math.max(0, config.height - currentLinesTotal - 5);
    for (let i = 0; i < blankNeeded; i++) {
      output.push('');
    }

    // 5. Framed Command Input Box
    const isInputFocused = this.focusManager.getFocus() === 'input';
    const inputLines = InputBoxRenderer.render(this.currentInput, this.cursorIndex, config.width, isInputFocused);
    output.push(...inputLines);

    // 6. Status Bar
    const statusLines = StatusBarRenderer.render(config);
    output.push(...statusLines);

    // Write buffer directly to terminal
    process.stdout.write('\x1b[H\x1b[2J' + output.join('\n'));
  }

  private async handleKeyPress(key: KeyEvent): Promise<void> {
    // Exit shortcuts
    if ((key.ctrl && key.name === 'c') || (key.ctrl && key.name === 'd')) {
      await this.stop();
      process.exit(0);
      return;
    }

    const currentFocus = this.focusManager.getFocus();

    // Tab key: Toggle focus or pick suggestion
    if (key.name === 'tab') {
      if (this.suggestions.length > 0) {
        const picked = this.suggestions[this.selectedSuggestionIndex];
        if (picked) {
          this.currentInput = picked.command;
          this.cursorIndex = this.currentInput.length;
          this.suggestions = [];
          this.focusManager.setSuggestionsActive(false);
          this.renderScreen();
          return;
        }
      }

      if (this.activeSelector) {
        this.focusManager.toggleFocus();
        this.renderScreen();
        return;
      }
    }

    // --- NAVIGATION: SUGGESTIONS ---
    if (currentFocus === 'suggestions' && this.suggestions.length > 0) {
      if (key.name === 'up') {
        this.selectedSuggestionIndex = Math.max(0, this.selectedSuggestionIndex - 1);
        this.renderScreen();
        return;
      }
      if (key.name === 'down') {
        this.selectedSuggestionIndex = Math.min(this.suggestions.length - 1, this.selectedSuggestionIndex + 1);
        this.renderScreen();
        return;
      }
      if (key.name === 'return' || key.name === 'enter') {
        const picked = this.suggestions[this.selectedSuggestionIndex];
        if (picked) {
          this.currentInput = picked.command;
          this.cursorIndex = this.currentInput.length;
          this.suggestions = [];
          this.focusManager.setSuggestionsActive(false);
          this.renderScreen();
          return;
        }
      }
      if (key.name === 'escape') {
        this.suggestions = [];
        this.focusManager.setSuggestionsActive(false);
        this.renderScreen();
        return;
      }
    }

    // --- NAVIGATION: INTERACTIVE SELECTOR LIST ---
    if (currentFocus === 'selector' && this.activeSelector) {
      if (key.name === 'up') {
        this.activeSelector.navigateUp();
        this.renderScreen();
        return;
      }
      if (key.name === 'down') {
        this.activeSelector.navigateDown();
        this.renderScreen();
        return;
      }
      if (key.name === 'return' || key.name === 'enter') {
        const selected = this.activeSelector.getSelectedItem();
        if (selected) {
          if (selected.action) {
            await selected.action();
          } else if (this.onSelectorSubmit) {
            await this.onSelectorSubmit(selected);
          }
        }
        return;
      }
      if (key.name === 'escape') {
        this.clearSelector();
        return;
      }
    }

    // --- COMMAND INPUT FOCUSED ---
    if (key.name === 'return' || key.name === 'enter') {
      const cmdToExec = this.currentInput.trim();
      if (!cmdToExec) return;

      this.history.push(cmdToExec);
      this.currentInput = '';
      this.cursorIndex = 0;
      this.suggestions = [];
      this.focusManager.setSuggestionsActive(false);

      if (this.onCommandSubmit) {
        const result = await this.onCommandSubmit(cmdToExec);
        if (result.clearScreen) {
          this.clearContent();
        }
        if (result.blocks && result.blocks.length > 0) {
          this.addBlocks(result.blocks);
        } else if (result.message) {
          this.addBlocks([
            {
              type: result.success ? 'success' : 'error',
              title: result.success ? 'Operación Cloud Exitosa' : 'Aviso',
              content: result.message,
            },
          ]);
        }

        if (result.exitApp) {
          await this.stop();
          process.exit(0);
          return;
        }
      }

      this.renderScreen();
      return;
    }

    if (key.name === 'up') {
      const prev = this.history.navigateUp(this.currentInput);
      if (prev !== null) {
        this.currentInput = prev;
        this.cursorIndex = this.currentInput.length;
        this.updateSuggestions();
        this.renderScreen();
      }
      return;
    }

    if (key.name === 'down') {
      const next = this.history.navigateDown();
      if (next !== null) {
        this.currentInput = next;
        this.cursorIndex = this.currentInput.length;
        this.updateSuggestions();
        this.renderScreen();
      }
      return;
    }

    if (key.name === 'backspace') {
      if (this.currentInput.length > 0) {
        this.currentInput = this.currentInput.slice(0, -1);
        this.cursorIndex = Math.max(0, this.cursorIndex - 1);
        this.updateSuggestions();
        this.renderScreen();
      }
      return;
    }

    if (key.name === 'escape') {
      this.currentInput = '';
      this.cursorIndex = 0;
      this.suggestions = [];
      this.focusManager.setSuggestionsActive(false);
      this.renderScreen();
      return;
    }

    // Normal typing
    if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
      this.currentInput += key.sequence;
      this.cursorIndex++;
      this.updateSuggestions();
      this.renderScreen();
    }
  }

  private updateSuggestions(): void {
    if (this.currentInput.startsWith('/')) {
      this.suggestions = this.registry.getSuggestions(this.currentInput, 5);
      this.selectedSuggestionIndex = 0;
      this.focusManager.setSuggestionsActive(this.suggestions.length > 0);
    } else {
      this.suggestions = [];
      this.focusManager.setSuggestionsActive(false);
    }
  }
}
