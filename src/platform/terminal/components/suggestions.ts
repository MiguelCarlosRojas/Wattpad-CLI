import { Suggestion } from '../../../core/types/command.types';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export class SuggestionsDropdown {
  public static render(
    suggestions: Suggestion[],
    selectedIndex: number,
    width: number = 80
  ): string[] {
    if (!suggestions || suggestions.length === 0) return [];

    const lines: string[] = [];
    const boxWidth = Math.max(40, width);
    const borderColor = Theme.colors.primary;

    const MAX_VISIBLE = 8;
    let startIndex = 0;
    if (selectedIndex >= MAX_VISIBLE) {
      startIndex = Math.min(selectedIndex - MAX_VISIBLE + 1, suggestions.length - MAX_VISIBLE);
    }
    startIndex = Math.max(0, startIndex);
    const visibleList = suggestions.slice(startIndex, startIndex + MAX_VISIBLE);

    const title = ' Sugerencias ';
    const topBarLen = Math.max(2, boxWidth - 3 - title.length);
    lines.push(
      Chalk.hex(borderColor, Theme.borders.topLeft + Theme.borders.horizontal) +
      Chalk.bold(Chalk.hex(Theme.colors.primary, title)) +
      Chalk.hex(borderColor, Theme.borders.horizontal.repeat(topBarLen) + Theme.borders.topRight)
    );

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

    for (let idx = 0; idx < visibleList.length; idx++) {
      const actualIndex = startIndex + idx;
      const item = visibleList[idx];
      const isSelected = actualIndex === selectedIndex;

      let rowContent: string;
      const cmdPadded = item.command.padEnd(16);
      if (isSelected) {
        const arrow = Chalk.bold(Chalk.hex(Theme.colors.primary, ' › '));
        const cmd = Chalk.bold(Chalk.hex(Theme.colors.primary, cmdPadded));
        const desc = Chalk.bold(Chalk.hex(Theme.colors.white, item.description));
        rowContent = `${arrow}${cmd} ${desc}`;
      } else {
        const arrow = '   ';
        const cmd = Chalk.hex(Theme.colors.textSecondary, cmdPadded);
        const desc = Chalk.dim(item.description);
        rowContent = `${arrow}${cmd} ${desc}`;
      }

      lines.push(padRow(rowContent));
    }

    const footerText = ' ↑↓ Navegar · Tab Completar · Enter Ejecutar · Esc Cerrar ';
    const botBarLen = Math.max(2, boxWidth - 3 - footerText.length);
    lines.push(
      Chalk.hex(borderColor, Theme.borders.bottomLeft + Theme.borders.horizontal) +
      Chalk.dim(footerText) +
      Chalk.hex(borderColor, Theme.borders.horizontal.repeat(botBarLen) + Theme.borders.bottomRight)
    );

    return lines;
  }
}

