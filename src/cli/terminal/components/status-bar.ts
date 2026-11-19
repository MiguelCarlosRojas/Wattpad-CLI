import { ResponsiveLayoutConfig } from '../responsive';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface StatusBarProps {
  notification?: string | null;
  activeContext?: string | null;
}

export class StatusBar {
  public static render(
    config: ResponsiveLayoutConfig,
    propsOrNotification?: StatusBarProps | string | null
  ): string[] {
    const lines: string[] = [];
    const width = config.width || 80;

    const notification =
      typeof propsOrNotification === 'string'
        ? propsOrNotification
        : propsOrNotification?.notification;

    if (notification) {
      const toast = `  ${Chalk.hex(Theme.colors.primary, 'ℹ')} ${Chalk.hex(Theme.colors.text, notification)}`;
      lines.push(padEndVisible(toast, width));
      return lines;
    }

    const dot = Chalk.dim('  ·  ');

    if (width < 60 || config.isCompact) {
      // Narrow terminals
      const compactItems = [
        Chalk.dim('↑↓') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Historial'),
        Chalk.dim('Tab') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Completar'),
        Chalk.dim('Ctrl+C') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Salir'),
      ];
      const bar = '  ' + compactItems.join(dot);
      lines.push(padEndVisible(bar, width));
      return lines;
    }

    // Standard width
    const items = [
      Chalk.dim('↑↓') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Historial'),
      Chalk.dim('Enter') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Ejecutar'),
      Chalk.dim('Tab') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Autocompletar'),
      Chalk.dim('/') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Comandos'),
      Chalk.dim('Ctrl+C') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Salir'),
    ];

    const bar = '  ' + items.join(dot);
    lines.push(padEndVisible(bar, width));
    return lines;
  }
}

// Backward-compatibility alias
export class StatusBarRenderer {
  public static render(config: ResponsiveLayoutConfig, notification?: string | null): string[] {
    return StatusBar.render(config, notification);
  }
}
