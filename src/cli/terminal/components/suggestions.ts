import { Suggestion } from '../../../types/command.types';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export class SuggestionsDropdown {
  public static render(
    suggestions: Suggestion[],
    selectedIndex: number,
    width: number
  ): string[] {
    if (!suggestions || suggestions.length === 0) return [];

    const lines: string[] = [];
    lines.push(Chalk.dim('Sugerencias de comandos (Tab para autocompletar):'));

    const displayList = suggestions.slice(0, 5);
    for (let i = 0; i < displayList.length; i++) {
      const s = displayList[i];
      const isSelected = i === selectedIndex;

      let line: string;
      if (isSelected) {
        const arrow = Chalk.hex(Theme.colors.primary, '›');
        const cmd = Chalk.bold(Chalk.hex(Theme.colors.white, s.command));
        const desc = Chalk.dim(s.description);
        line = ` ${arrow} ${cmd}  ${desc}`;
      } else {
        const cmd = Chalk.hex(Theme.colors.primary, s.command);
        const desc = Chalk.dim(s.description);
        line = `   ${cmd}  ${desc}`;
      }

      lines.push(padEndVisible(line, width));
    }

    return lines;
  }
}
