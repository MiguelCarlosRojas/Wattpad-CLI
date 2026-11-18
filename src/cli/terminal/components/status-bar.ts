import { Theme, Chalk } from '../theme';
import { ResponsiveLayoutConfig } from '../responsive';

export class StatusBarRenderer {
  public static render(config: ResponsiveLayoutConfig, customShortcuts?: string): string[] {
    if (customShortcuts) {
      return [Chalk.hex(Theme.colors.muted, `  ${customShortcuts}`)];
    }

    if (config.isCompact || config.compactStatusBar) {
      const line = `  ${Chalk.hex(Theme.colors.textSecondary, 'Tab')} ${Chalk.hex(Theme.colors.muted, 'Autocomp')}  ${Chalk.hex(Theme.colors.divider, '·')}  ${Chalk.hex(Theme.colors.textSecondary, 'Enter')} ${Chalk.hex(Theme.colors.muted, 'Ejecutar')}  ${Chalk.hex(Theme.colors.divider, '·')}  ${Chalk.hex(Theme.colors.textSecondary, '/exit')} ${Chalk.hex(Theme.colors.muted, 'Salir')}`;
      return [line];
    }

    const line = `  ${Chalk.hex(Theme.colors.textSecondary, 'Tab')} ${Chalk.hex(Theme.colors.muted, 'Autocompletar')}  ${Chalk.hex(Theme.colors.divider, '·')}  ${Chalk.hex(Theme.colors.textSecondary, 'Enter')} ${Chalk.hex(Theme.colors.muted, 'Ejecutar')}  ${Chalk.hex(Theme.colors.divider, '·')}  ${Chalk.hex(Theme.colors.textSecondary, '↑↓')} ${Chalk.hex(Theme.colors.muted, 'Historial/Navegar')}  ${Chalk.hex(Theme.colors.divider, '·')}  ${Chalk.hex(Theme.colors.textSecondary, '/help')} ${Chalk.hex(Theme.colors.muted, 'Ayuda')}  ${Chalk.hex(Theme.colors.divider, '·')}  ${Chalk.hex(Theme.colors.textSecondary, '/exit')} ${Chalk.hex(Theme.colors.muted, 'Salir')}`;
    return [line];
  }
}
