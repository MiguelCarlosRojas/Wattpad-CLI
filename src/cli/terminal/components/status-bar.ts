import { Theme, Chalk } from '../theme';
import { ResponsiveLayoutConfig } from '../responsive';

export class StatusBarRenderer {
  public static render(config: ResponsiveLayoutConfig, customShortcuts?: string): string[] {
    const width = config.width;
    const b = Theme.borders;

    let shortcuts = '';
    if (customShortcuts) {
      shortcuts = customShortcuts;
    } else if (config.isCompact || config.compactStatusBar) {
      shortcuts = ' Tab Autocomp │ Enter Ejecutar │ /exit Salir ';
    } else {
      shortcuts = ' Tab Autocompletar │ Enter Ejecutar │ ↑↓ Navegar/Historial │ /help Ayuda │ /exit Salir ';
    }

    const styledShortcuts = Chalk.dim(shortcuts);
    const rawLen = shortcuts.length;

    const remaining = Math.max(0, width - 2 - rawLen);
    const borderLine = Chalk.hex(Theme.colors.surfaceBorder, `${b.horizontal}${shortcuts}${b.horizontal.repeat(remaining)}`);

    return [borderLine];
  }
}
