import { Theme, Chalk, stripAnsi } from '../theme';

export class CommandInput {
  public static render(
    value: string,
    cursorIndex: number,
    width: number = 80,
    isFocused: boolean = true
  ): string[] {
    const lines: string[] = [];
    const boxWidth = Math.max(40, width);
    const borderColor = isFocused ? Theme.colors.primary : Theme.colors.surfaceBorder;

    // Line 1: ╭─ Wattpad CLI ────────────────────────────────────────╮
    const titleText = ' Wattpad CLI ';
    const topBarLength = Math.max(2, boxWidth - 3 - titleText.length);
    const line1 =
      Chalk.hex(borderColor, Theme.borders.topLeft + Theme.borders.horizontal) +
      Chalk.bold(Chalk.hex(Theme.colors.primary, titleText)) +
      Chalk.hex(borderColor, Theme.borders.horizontal.repeat(topBarLength) + Theme.borders.topRight);
    lines.push(line1);

    const padRow = (content: string) => {
      const plainLen = stripAnsi(content).length;
      const padSpaces = Math.max(0, boxWidth - 2 - plainLen);
      return (
        Chalk.hex(borderColor, Theme.borders.vertical) +
        content +
        ' '.repeat(padSpaces) +
        Chalk.hex(borderColor, Theme.borders.vertical)
      );
    };

    // Padding line 1
    lines.push(padRow(' '));

    // Prompt + Content
    const promptSymbol = isFocused
      ? Chalk.bold(Chalk.hex(Theme.colors.primary, '  ❯ '))
      : Chalk.dim('  ❯ ');

    let content: string;
    if (value.length === 0) {
      content = Chalk.dim('Escribe un comando o selecciona una operación');
    } else {
      const before = value.slice(0, cursorIndex);
      const cursorChar = value.slice(cursorIndex, cursorIndex + 1) || ' ';
      const after = value.slice(cursorIndex + 1);

      const styledCursor = isFocused ? Chalk.inverse(cursorChar) : cursorChar;
      content = Chalk.hex(Theme.colors.text, Chalk.bold(before)) + styledCursor + Chalk.hex(Theme.colors.text, after);
    }

    lines.push(padRow(`${promptSymbol}${content}`));

    // Padding line 2
    lines.push(padRow(' '));

    // Bottom border: ╰─ ? Ayuda · / Comandos · ↑↓ Historial · Tab Autocompletar · Ctrl+C Salir ──╯
    let footerText = ' ? Ayuda · / Comandos · ↑↓ Historial · Tab Autocompletar · Ctrl+C Salir ';
    if (boxWidth < 78) {
      footerText = ' ? Ayuda · / Comandos · Ctrl+C Salir ';
    }
    const bottomBarLength = Math.max(2, boxWidth - 3 - footerText.length);
    const line5 =
      Chalk.hex(borderColor, Theme.borders.bottomLeft + Theme.borders.horizontal) +
      Chalk.dim(footerText) +
      Chalk.hex(borderColor, Theme.borders.horizontal.repeat(bottomBarLength) + Theme.borders.bottomRight);
    lines.push(line5);

    return lines;
  }
}
