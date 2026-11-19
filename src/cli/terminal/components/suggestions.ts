import { Suggestion } from '../../../types/command.types';
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

    const title = ' Comandos ';
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

    const displayList = suggestions.slice(0, 5);
    for (let i = 0; i < displayList.length; i++) {
      const s = displayList[i];
      const isSelected = i === selectedIndex;

      let rowContent: string;
      if (isSelected) {
        const arrow = Chalk.bold(Chalk.hex(Theme.colors.primary, '› '));
        const cmd = Chalk.bold(Chalk.hex(Theme.colors.white, s.command.padEnd(20)));
        const desc = Chalk.hex(Theme.colors.textSecondary, s.description);
        rowContent = ` ${arrow}${cmd} ${desc}`;
      } else {
        const cmd = Chalk.hex(Theme.colors.primary, s.command.padEnd(20));
        const desc = Chalk.dim(s.description);
        rowContent = `   ${cmd} ${desc}`;
      }

      lines.push(padRow(rowContent));
    }

    const footerText = ' ↑↓ Navegar · Tab Autocompletar · Esc Cerrar ';
    const botBarLen = Math.max(2, boxWidth - 3 - footerText.length);
    lines.push(
      Chalk.hex(borderColor, Theme.borders.bottomLeft + Theme.borders.horizontal) +
      Chalk.dim(footerText) +
      Chalk.hex(borderColor, Theme.borders.horizontal.repeat(botBarLen) + Theme.borders.bottomRight)
    );

    return lines;
  }
}

