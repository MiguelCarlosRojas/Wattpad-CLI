import { Theme, Chalk } from '../theme';

export class InputBoxRenderer {
  public static render(input: string, cursorIndex: number, width: number = 80, isFocused: boolean = true): string[] {
    const lines: string[] = [];
    const b = Theme.borders;
    const boxWidth = Math.max(30, width - 2);
    const borderColor = isFocused ? Theme.colors.primary : Theme.colors.surfaceBorder;

    // Top border
    lines.push(Chalk.hex(borderColor, `${b.topLeft}${b.horizontal.repeat(boxWidth)}${b.topRight}`));

    // Input line
    const promptPrefix = Chalk.hex(Theme.colors.primary, Chalk.bold(' › '));
    let contentDisplay = '';

    if (input.length === 0) {
      contentDisplay = Chalk.dim('Escribe un comando (/help para consultar)...');
    } else {
      contentDisplay = Chalk.hex(Theme.colors.white, input);
    }

    const rawLen = input.length === 0 ? 44 : 3 + input.length;
    const remaining = Math.max(0, boxWidth - rawLen);

    lines.push(
      `${Chalk.hex(borderColor, b.vertical)}${promptPrefix}${contentDisplay}${' '.repeat(remaining)}${Chalk.hex(borderColor, b.vertical)}`
    );

    // Bottom border
    lines.push(Chalk.hex(borderColor, `${b.bottomLeft}${b.horizontal.repeat(boxWidth)}${b.bottomRight}`));

    return lines;
  }
}
