import { Theme, Chalk } from '../theme';

export class InputBoxRenderer {
  public static render(input: string, cursorIndex: number, width: number = 80, isFocused: boolean = true): string[] {
    const lines: string[] = [];
    const isCompact = width < 75;

    // Line 1: Minimal border divider
    const dividerColor = isFocused ? Theme.colors.divider : Theme.colors.surfaceBorder;
    lines.push(Chalk.hex(dividerColor, '─'.repeat(width)));

    // Line 2: Modern clean prompt
    const promptSymbol = Chalk.hex(Theme.colors.primary, Chalk.bold('  › '));
    let contentDisplay = '';

    if (input.length === 0) {
      const placeholder = isCompact
        ? 'Escribe un comando (/help)...'
        : 'Escribe un comando o acción (/help para consultar)...';
      contentDisplay = Chalk.hex(Theme.colors.muted, placeholder);
    } else {
      contentDisplay = Chalk.hex(Theme.colors.text, Chalk.bold(input));
    }

    lines.push(`${promptSymbol}${contentDisplay}`);

    // Line 3: Contextual hints bar
    let hints = '';
    if (isCompact) {
      hints = '  Tab Autocompletar · Enter Ejecutar · /exit Salir';
    } else {
      hints = '  Tab Autocompletar · ↑↓ Navegar/Historial · Esc Cancelar · /help Ayuda · /exit Salir';
    }
    lines.push(Chalk.hex(Theme.colors.muted, hints));

    return lines;
  }
}
