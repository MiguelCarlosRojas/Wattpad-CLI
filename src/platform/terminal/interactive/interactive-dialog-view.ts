import readline from 'readline';
import { InteractiveView } from './interactive-view.interface';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface DialogOption {
  id: string;
  label: string;
  isDestructive?: boolean;
}

export interface DialogViewProps {
  id: string;
  title: string;
  message: string;
  details?: string[];
  options: DialogOption[];
  defaultOptionIndex?: number;
  onConfirm?: (optionId: string) => Promise<void> | void;
}

export class InteractiveDialogView implements InteractiveView {
  private selectedIndex: number;

  constructor(private props: DialogViewProps) {
    this.selectedIndex = props.defaultOptionIndex ?? 0;
  }

  public getId(): string {
    return this.props.id;
  }

  public getTitle(): string {
    return this.props.title;
  }

  public getBreadcrumbs(): string[] {
    return ['Wattpad CLI', this.props.title];
  }

  public getStatusBarHint(): string {
    return '←/→ Elegir opción  ·  Enter Confirmar  ·  Esc Cancelar';
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const w = Math.max(50, width);
    const innerW = w - 4;

    const topBar =
      Chalk.hex(Theme.colors.surfaceBorder, '╭─ ') +
      Chalk.bold(Chalk.hex(Theme.colors.warning, this.props.title)) +
      Chalk.hex(Theme.colors.surfaceBorder, ` ${'─'.repeat(Math.max(2, w - this.props.title.length - 6))}╮`);
    lines.push(topBar);

    lines.push(
      Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
      padEndVisible('', innerW) +
      Chalk.hex(Theme.colors.surfaceBorder, ' │')
    );

    // Mensaje principal
    lines.push(
      Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
      padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.text, `  ${this.props.message}`)), innerW) +
      Chalk.hex(Theme.colors.surfaceBorder, ' │')
    );

    if (this.props.details) {
      this.props.details.forEach((dt) => {
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.dim(`    ${dt}`), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      });
    }

    lines.push(
      Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
      padEndVisible('', innerW) +
      Chalk.hex(Theme.colors.surfaceBorder, ' │')
    );

    // Botones horizontales [ Opción 1 ]   [ Opción 2 ]
    const buttonsStr = this.props.options
      .map((opt, idx) => {
        const isSel = idx === this.selectedIndex;
        if (isSel) {
          const color = opt.isDestructive ? Theme.colors.error : Theme.colors.primary;
          return Chalk.bold(Chalk.hex(color, `[  ●  ${opt.label}  ]`));
        } else {
          return Chalk.dim(`[     ${opt.label}   ]`);
        }
      })
      .join('     ');

    lines.push(
      Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
      padEndVisible(`      ${buttonsStr}`, innerW) +
      Chalk.hex(Theme.colors.surfaceBorder, ' │')
    );

    while (lines.length < height - 2) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible('', innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    }

    lines.push(Chalk.hex(Theme.colors.surfaceBorder, `╰${'─'.repeat(w - 2)}╯`));
    return lines;
  }

  public handleKeyPress(str: string, key: readline.Key): boolean | 'pop' {
    if (key.name === 'escape') {
      return 'pop';
    }

    if (key.name === 'left') {
      this.selectedIndex = (this.selectedIndex - 1 + this.props.options.length) % this.props.options.length;
      return true;
    }
    if (key.name === 'right') {
      this.selectedIndex = (this.selectedIndex + 1) % this.props.options.length;
      return true;
    }

    if (key.name === 'return') {
      const chosen = this.props.options[this.selectedIndex];
      if (chosen && this.props.onConfirm) {
        this.props.onConfirm(chosen.id);
      }
      return 'pop';
    }

    return true;
  }
}
