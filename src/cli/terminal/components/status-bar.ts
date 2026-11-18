import { ResponsiveLayoutConfig } from '../responsive';
import { Theme, Chalk, padEndVisible } from '../theme';

export class StatusBar {
  public static render(config: ResponsiveLayoutConfig, notificationMessage?: string | null): string[] {
    const lines: string[] = [];

    if (notificationMessage) {
      const toast = Chalk.hex(Theme.colors.info, `ℹ ${notificationMessage}`);
      lines.push(padEndVisible(toast, config.width));
      return lines;
    }

    if (config.compactStatusBar || config.isCompact) {
      const shortcuts = Chalk.dim('↑↓ Nav │ Enter OK │ Esc Volver │ Ctrl+C Salir');
      lines.push(padEndVisible(shortcuts, config.width));
      return lines;
    }

    const sep = Chalk.dim('  │  ');
    const items = [
      Chalk.dim('↑↓') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Navegar'),
      Chalk.dim('Enter') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Seleccionar'),
      Chalk.dim('Esc') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Volver'),
      Chalk.dim('Tab') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Alternar foco'),
      Chalk.dim('/') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Comandos'),
      Chalk.dim('Ctrl+C') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Salir'),
    ];

    const bar = items.join(sep);
    lines.push(padEndVisible(bar, config.width));
    return lines;
  }
}

// Backward-compatibility alias
export class StatusBarRenderer {
  public static render(config: ResponsiveLayoutConfig): string[] {
    return StatusBar.render(config);
  }
}
