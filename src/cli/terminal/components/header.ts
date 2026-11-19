import { ResponsiveLayoutConfig } from '../responsive';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface HeaderProps {
  version: string;
  user?: string | null;
  isAuthenticated: boolean;
  serverUrl?: string;
  serverOnline?: boolean;
  activeStory?: string | null;
  activeChapter?: string | null;
}

export class Header {
  public static render(props: HeaderProps, config: ResponsiveLayoutConfig): string[] {
    const lines: string[] = [];
    const width = Math.max(50, config.width || 80);

    const brand = Chalk.bold(Chalk.hex(Theme.colors.primary, 'WATTPAD CLI'));
    const version = Chalk.dim(`v${props.version || '1.0.0'}`);
    const leftText = `${brand} ${version}`;

    // Estado superior sobrio especificado exactamente:
    // `WATTPAD CLI v1.0.0     ● @usuario     Conectado`
    // Si no hay sesión:
    // `WATTPAD CLI v1.0.0     ○ Sin conexión`
    let rightStatus: string;
    if (props.isAuthenticated && props.user && props.user !== 'Desconectado' && props.user !== 'Sin conectar') {
      const username = props.user.startsWith('@') ? props.user : `@${props.user}`;
      const dot = Chalk.hex(Theme.colors.success, '●');
      const userStyled = Chalk.bold(Chalk.hex(Theme.colors.primary, username));
      const connectedWord = Chalk.hex(Theme.colors.success, 'Conectado');
      rightStatus = `${dot} ${userStyled}     ${connectedWord}`;
    } else {
      const emptyDot = Chalk.dim('○');
      const disconnectedWord = Chalk.dim('Sin conexión');
      rightStatus = `${emptyDot} ${disconnectedWord}`;
    }

    const leftLen = stripAnsi(leftText).length;
    const rightLen = stripAnsi(rightStatus).length;
    const spacing = Math.max(4, width - leftLen - rightLen);

    lines.push(`${leftText}${' '.repeat(spacing)}${rightStatus}`);

    // Si se especifica servidor o entorno de pruebas
    if (props.serverOnline && props.user && props.isAuthenticated) {
      const subInfo = Chalk.dim(`Cuenta: ${props.user.startsWith('@') ? props.user : '@' + props.user} · Wattpad conectado ◉`);
      lines.push(padEndVisible(subInfo, width));
    }

    // Contexto activo si existe (novela y capítulo)
    if (props.activeStory) {
      const activeCtx =
        Chalk.dim('Novela: ') +
        Chalk.hex(Theme.colors.primary, props.activeStory) +
        (props.activeChapter ? Chalk.dim(' · Cap: ') + Chalk.hex(Theme.colors.text, props.activeChapter) : '');
      lines.push(padEndVisible(activeCtx, width));
    }

    // Línea separadora sutil
    lines.push(Chalk.hex(Theme.colors.surfaceBorder, '─'.repeat(width)));
    return lines;
  }
}
