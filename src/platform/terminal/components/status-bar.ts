import { ResponsiveLayoutConfig } from '../responsive';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface StatusBarProps {
  notification?: string | null;
  activeContext?: string | null;
  mode?: 'completa' | 'compacta' | 'zen';
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

    const mode =
      typeof propsOrNotification === 'object' && propsOrNotification?.mode
        ? propsOrNotification.mode
        : 'completa';

    if (notification) {
      const toast = `  ${Chalk.hex(Theme.colors.primary, 'ℹ')} ${Chalk.hex(Theme.colors.text, notification)}`;
      lines.push(padEndVisible(toast, width));
      return lines;
    }

    const dot = Chalk.dim('  ·  ');
    const modeBadge = Chalk.dim(`[Modo: ${mode.charAt(0).toUpperCase() + mode.slice(1)}]`);

    if (width < 70 || config.isCompact) {
      // Narrow terminals
      const compactItems = [
        Chalk.dim('↑↓') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Historial'),
        Chalk.dim('Tab') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Completar'),
        Chalk.dim('Ctrl+P') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Paleta'),
        Chalk.dim('Ctrl+C') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Salir'),
      ];
      const bar = '  ' + compactItems.join(dot);
      lines.push(padEndVisible(bar, width));
      return lines;
    }

    // Standard width
    const items = [
      Chalk.dim('? ') + Chalk.hex(Theme.colors.textSecondary, 'Ayuda'),
      Chalk.dim('/ ') + Chalk.hex(Theme.colors.textSecondary, 'Comandos'),
      Chalk.dim('↑↓ ') + Chalk.hex(Theme.colors.textSecondary, 'Historial'),
      Chalk.dim('Enter ') + Chalk.hex(Theme.colors.textSecondary, 'Ejecutar'),
      Chalk.dim('Tab ') + Chalk.hex(Theme.colors.textSecondary, 'Autocompletar'),
      Chalk.bold(Chalk.hex(Theme.colors.primary, 'Ctrl+P ')) + Chalk.hex(Theme.colors.textSecondary, 'Paleta'),
      Chalk.dim('Ctrl+C ') + Chalk.hex(Theme.colors.textSecondary, 'Salir'),
    ];

    const leftPart = '  ' + items.join(dot);
    const leftLen = stripAnsi(leftPart).length;
    const rightLen = stripAnsi(modeBadge).length;
    const pad = Math.max(2, width - leftLen - rightLen - 2);

    const bar = `${leftPart}${' '.repeat(pad)}${modeBadge}  `;
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
