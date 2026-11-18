import { Theme, Chalk } from '../theme';

export class InputBoxRenderer {
  public static render(input: string, cursorIndex: number, width: number = 80, isFocused: boolean = true): string[] {
    const lines: string[] = [];
    const b = Theme.borders;
    const boxWidth = Math.max(30, width - 2);
    const borderColor = isFocused ? Theme.colors.primary : Theme.colors.surfaceBorder;

    // Top border with refined label and status pill
    const titleTag = isFocused ? ' Comando ' : ' Input ';
    const cloudTag = ' [Cloud Ready] ';
    const rawTagLen = titleTag.length + cloudTag.length;
    const remainingTop = Math.max(0, boxWidth - rawTagLen - 2);

    const topBorder =
      Chalk.hex(borderColor, `${b.topLeft}${b.horizontal}`) +
      Chalk.hex(Theme.colors.primary, Chalk.bold(titleTag)) +
      Chalk.hex(borderColor, b.horizontal.repeat(remainingTop)) +
      Chalk.hex(Theme.colors.success, cloudTag) +
      Chalk.hex(borderColor, `${b.horizontal}${b.topRight}`);

    lines.push(topBorder);

    // Input line: Wattpad Orange prompt ❯
    const promptPrefix = Chalk.hex(Theme.colors.primary, Chalk.bold(' ❯ '));
    let contentDisplay = '';

    if (input.length === 0) {
      contentDisplay = Chalk.dim('Escribe un comando (/help para consultar sugerencias)...');
    } else {
      contentDisplay = Chalk.hex(Theme.colors.white, input);
    }

    const rawLen = input.length === 0 ? 56 : 3 + input.length;
    const remaining = Math.max(0, boxWidth - rawLen);

    lines.push(
      `${Chalk.hex(borderColor, b.vertical)}${promptPrefix}${contentDisplay}${' '.repeat(remaining)}${Chalk.hex(borderColor, b.vertical)}`
    );

    // Bottom border
    lines.push(Chalk.hex(borderColor, `${b.bottomLeft}${b.horizontal.repeat(boxWidth)}${b.bottomRight}`));

    return lines;
  }
}
