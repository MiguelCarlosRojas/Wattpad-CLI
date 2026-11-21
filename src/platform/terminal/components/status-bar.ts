import { ResponsiveLayoutConfig } from '../responsive';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface StatusBarProps {
  notification?: string | null;
  activeContext?: 'normal' | 'suggestions' | 'selector' | 'editor' | 'palette' | 'interactive' | string;
  customHint?: string | null;
  mode?: 'completa' | 'compacta' | 'zen';
  isAuthenticated?: boolean;
  user?: string | null;
  serverOnline?: boolean;
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

    const props: StatusBarProps =
      typeof propsOrNotification === 'object' && propsOrNotification !== null
        ? propsOrNotification
        : {};

    const mode = props.mode || 'completa';
    const activeContext = props.activeContext || 'normal';

    if (notification) {
      const toast = `  ${Chalk.hex(Theme.colors.primary, 'ℹ')} ${Chalk.hex(Theme.colors.text, notification)}`;
      const modeBadge = Chalk.dim(`[Modo: ${mode.charAt(0).toUpperCase() + mode.slice(1)}]`);
      const toastLen = stripAnsi(toast).length;
      const rightLen = stripAnsi(modeBadge).length;
      const pad = Math.max(2, width - toastLen - rightLen - 2);
      lines.push(padEndVisible(`${toast}${' '.repeat(pad)}${modeBadge}  `, width));
      return lines;
    }

    const dot = Chalk.dim('  ·  ');
    const modeBadge = Chalk.dim(`[Modo: ${mode.charAt(0).toUpperCase() + mode.slice(1)}]`);

    let connBadge = '';
    if (props.isAuthenticated && props.user) {
      const u = props.user.startsWith('@') ? props.user : `@${props.user}`;
      connBadge = `${Chalk.hex(Theme.colors.success, '●')} ${Chalk.hex(Theme.colors.textSecondary, u)}`;
    } else if (props.isAuthenticated === false) {
      connBadge = `${Chalk.dim('○ Sin conexión')}`;
    }

    // Contextual shortcuts
    let shortcutItems: string[] = [];

    if (activeContext === 'suggestions') {
      shortcutItems = [
        Chalk.dim('↑↓') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Navegar sugerencias'),
        Chalk.dim('Enter') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Ejecutar'),
        Chalk.dim('Tab') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Completar'),
        Chalk.dim('Esc') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Cerrar'),
      ];
    } else if (activeContext === 'selector') {
      shortcutItems = [
        Chalk.dim('↑↓') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Seleccionar'),
        Chalk.dim('←→') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Paneles'),
        Chalk.dim('Enter') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Acciones'),
        Chalk.dim('Esc') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Volver'),
      ];
    } else if (activeContext === 'editor') {
      shortcutItems = [
        Chalk.dim('Ctrl+S') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Guardar'),
        Chalk.dim('Ctrl+F') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Buscar'),
        Chalk.dim('Esc') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Salir'),
      ];
    } else if (activeContext === 'interactive') {
      if (props.customHint) {
        shortcutItems = [Chalk.hex(Theme.colors.info, props.customHint)];
      } else {
        shortcutItems = [
          Chalk.dim('↑↓') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Navegar'),
          Chalk.dim('←→') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Cambiar'),
          Chalk.dim('Enter') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Confirmar'),
          Chalk.dim('Esc') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Volver'),
        ];
      }
    } else if (activeContext === 'palette') {
      shortcutItems = [
        Chalk.dim('↑↓') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Navegar'),
        Chalk.dim('Enter') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Ejecutar'),
        Chalk.dim('Esc') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Cerrar'),
      ];
    } else if (width < 70 || config.isCompact) {
      // Narrow terminals
      shortcutItems = [
        Chalk.dim('↑↓') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Historial'),
        Chalk.dim('Tab') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Completar'),
        Chalk.dim('Ctrl+P') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Paleta'),
        Chalk.dim('Ctrl+C') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Salir'),
      ];
    } else {
      // Standard normal input mode
      shortcutItems = [
        Chalk.dim('? ') + Chalk.hex(Theme.colors.textSecondary, 'Ayuda'),
        Chalk.dim('/ ') + Chalk.hex(Theme.colors.textSecondary, 'Comandos'),
        Chalk.dim('↑↓ ') + Chalk.hex(Theme.colors.textSecondary, 'Historial'),
        Chalk.dim('Enter ') + Chalk.hex(Theme.colors.textSecondary, 'Ejecutar'),
        Chalk.dim('Tab ') + Chalk.hex(Theme.colors.textSecondary, 'Autocompletar'),
        Chalk.bold(Chalk.hex(Theme.colors.primary, 'Ctrl+P ')) + Chalk.hex(Theme.colors.textSecondary, 'Paleta'),
        Chalk.dim('Ctrl+C ') + Chalk.hex(Theme.colors.textSecondary, 'Salir'),
      ];
    }

    const leftPart = '  ' + shortcutItems.join(dot);
    const rightComponents = [connBadge, modeBadge].filter(Boolean);
    const rightPart = rightComponents.join('  ');

    const leftLen = stripAnsi(leftPart).length;
    const rightLen = stripAnsi(rightPart).length;
    const pad = Math.max(2, width - leftLen - rightLen - 2);

    const bar = rightPart ? `${leftPart}${' '.repeat(pad)}${rightPart}  ` : leftPart;
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
