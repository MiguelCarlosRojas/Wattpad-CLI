import { Suggestion } from '../../../types/command.types';
import { Theme, Chalk } from '../theme';

export class SuggestionListRenderer {
  public static render(suggestions: Suggestion[], selectedIndex: number = 0, width: number = 70): string[] {
    if (suggestions.length === 0) return [];

    const lines: string[] = [];
    const contentWidth = Math.max(30, width - 4);

    // Dimmed modern header
    const header = Chalk.dim('  Comandos sugeridos') + Chalk.hex(Theme.colors.muted, ' · ↑↓ navegar  Tab autocompletar  Esc cerrar');
    lines.push(header);

    for (let i = 0; i < suggestions.length; i++) {
      const s = suggestions[i];
      const isSelected = i === selectedIndex;

      const cmdPad = s.command.padEnd(20);
      if (isSelected) {
        const marker = Chalk.bgHex(Theme.colors.primary, Chalk.hex(Theme.colors.white, Chalk.bold(' › ')));
        const cmd = Chalk.bold(Chalk.hex(Theme.colors.white, cmdPad));
        const desc = Chalk.hex(Theme.colors.textSecondary, s.description);
        lines.push(` ${marker} ${cmd} ${Chalk.hex(Theme.colors.divider, '│')} ${desc}`);
      } else {
        const cmd = Chalk.hex(Theme.colors.textSecondary, cmdPad);
        const desc = Chalk.hex(Theme.colors.muted, s.description);
        lines.push(`     ${cmd} ${Chalk.hex(Theme.colors.divider, '│')} ${desc}`);
      }
    }

    lines.push(Chalk.hex(Theme.colors.divider, '  ' + '─'.repeat(Math.min(contentWidth, 60))));
    return lines;
  }
}
