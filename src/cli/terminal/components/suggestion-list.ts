import { Suggestion } from '../../../types/command.types';
import { Theme, Chalk } from '../theme';

export class SuggestionListRenderer {
  public static render(suggestions: Suggestion[], selectedIndex: number = 0, width: number = 70): string[] {
    if (suggestions.length === 0) return [];

    const lines: string[] = [];
    const b = Theme.borders;
    const contentWidth = Math.max(30, width - 4);

    const title = ' SUGERENCIAS (↑↓ NAVEGAR │ TAB / ENTER SELECCIONAR) ';
    const remaining = Math.max(0, contentWidth - title.length);
    lines.push(
      Chalk.hex(Theme.colors.primary, `${b.topLeft}${b.horizontal}${title}${b.horizontal.repeat(remaining)}${b.topRight}`)
    );

    for (let i = 0; i < suggestions.length; i++) {
      const s = suggestions[i];
      const isSelected = i === selectedIndex;

      const cmdStr = s.command.padEnd(18);
      const descStr = s.description;
      const full = `  ${cmdStr} ${descStr}`;
      const lineStr = full.slice(0, contentWidth);

      if (isSelected) {
        const highlighted = Chalk.bgHex(Theme.colors.selectedBg, Chalk.bold(Chalk.hex(Theme.colors.selectedText, lineStr.padEnd(contentWidth))));
        lines.push(`${Chalk.hex(Theme.colors.primary, b.vertical)} ${highlighted} ${Chalk.hex(Theme.colors.primary, b.vertical)}`);
      } else {
        const formatted = Chalk.hex(Theme.colors.text, lineStr.padEnd(contentWidth));
        lines.push(`${Chalk.hex(Theme.colors.primary, b.vertical)} ${formatted} ${Chalk.hex(Theme.colors.primary, b.vertical)}`);
      }
    }

    lines.push(Chalk.hex(Theme.colors.primary, `${b.bottomLeft}${b.horizontal.repeat(contentWidth + 2)}${b.bottomRight}`));
    return lines;
  }
}
