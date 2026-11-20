import { ResponsiveLayoutConfig } from '../responsive';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface HeaderProps {
  version: string;
  user?: string | null;
  displayName?: string | null;
  profileVerified?: boolean;
  isAuthenticated: boolean;
  serverUrl?: string;
  serverOnline?: boolean;
  activeStory?: string | null;
  activeChapter?: string | null;
  mode?: 'completa' | 'compacta' | 'zen';
}

export class Header {
  public static render(props: HeaderProps, config: ResponsiveLayoutConfig): string[] {
    const lines: string[] = [];
    const width = Math.max(50, config.width || 80);
    const mode = props.mode || 'completa';

    // Modo ZEN: Ultra minimalista, una sola línea elegante
    if (mode === 'zen') {
      const brand = Chalk.bold(Chalk.hex(Theme.colors.primary, 'WATTPAD CLI'));
      const version = Chalk.dim(`v${props.version || '1.3.0'}`);
      const userText = props.isAuthenticated && props.user
        ? Chalk.hex(Theme.colors.success, `● @${props.user.replace(/^@/, '')}`)
        : Chalk.dim('○ Sin conexión');
      const zenLine = `${brand} ${version}  ·  ${userText}`;
      lines.push(padEndVisible(zenLine, width));
      lines.push(Chalk.hex(Theme.colors.surfaceBorder, '─'.repeat(width)));
      return lines;
    }

    const brand = Chalk.bold(Chalk.hex(Theme.colors.primary, 'WATTPAD CLI'));
    const version = Chalk.dim(`v${props.version || '1.3.0'}`);
    const isFullMode = mode === 'completa' && width >= 85 && !config.isCompact;
    const isMediumMode = mode === 'completa' && width >= 65 && width < 85 && !config.isCompact;

    // Logotipo icónico oficial de Wattpad en ANSI TrueColor
    const logo1 = isFullMode ? Chalk.bold(Chalk.hex(Theme.colors.primary, '██╗    ██╗  ')) : (isMediumMode ? Chalk.bold(Chalk.hex(Theme.colors.primary, '█W█ ')) : '');
    const logo2 = isFullMode ? Chalk.bold(Chalk.hex(Theme.colors.primary, '██║ █╗ ██║  ')) : (isMediumMode ? '    ' : '');
    const logo3 = isFullMode ? Chalk.bold(Chalk.hex(Theme.colors.primary, '╚███╔███╔╝  ')) : (isMediumMode ? '    ' : '');

    const leftText = `${logo1}${brand} ${version}`;

    // Estado superior:
    // Conectado:   ● @usuario_real     Conectado
    // Desconectado: ○ Sin conexión
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
    const available = width - leftLen - rightLen;

    // Línea 1 (Contiene Brand, Versión y Estado de conexión)
    if (available >= 2) {
      lines.push(`${leftText}${' '.repeat(available)}${rightStatus}`);
    } else {
      // Si el ancho no permite todo el texto, compactar rightStatus para evitar saltos de línea
      const compactUser = props.isAuthenticated && props.user
        ? Chalk.hex(Theme.colors.success, `● @${props.user.replace(/^@/, '')}`)
        : Chalk.dim('○ Desconectado');
      const cLen = stripAnsi(compactUser).length;
      const cSpacing = Math.max(1, width - leftLen - cLen);
      lines.push(padEndVisible(`${leftText}${' '.repeat(cSpacing)}${compactUser}`, width));
    }

    // Línea 2 (Subinformación de cuenta y autor oficial)
    if (props.isAuthenticated) {
      if (props.profileVerified === false) {
        const warnInfo = Chalk.hex(Theme.colors.warning, 'Cuenta: No se pudo verificar el perfil');
        lines.push(padEndVisible(`${logo2}${warnInfo}`, width));
      } else if (props.user && props.user !== 'Desconectado' && props.user !== 'Sin conectar') {
        const rawUser = props.user.startsWith('@') ? props.user.slice(1) : props.user;
        const displayName = props.displayName || (props.serverOnline ? 'Wattpad conectado ◉' : rawUser);
        const accountInfo = Chalk.dim(`Cuenta: @${rawUser} · ${displayName}`);
        lines.push(padEndVisible(`${logo2}${accountInfo}`, width));
      } else {
        const warnInfo = Chalk.hex(Theme.colors.warning, 'Cuenta: No se pudo verificar el perfil');
        lines.push(padEndVisible(`${logo2}${warnInfo}`, width));
      }
    } else if (isFullMode) {
      lines.push(padEndVisible(`${logo2}${Chalk.dim('Sesión de Wattpad desconectada · Ejecuta /login')}`, width));
    }

    // Línea 3 (Base del logotipo o contexto activo)
    if (props.activeStory) {
      const activeCtx =
        Chalk.dim('Novela: ') +
        Chalk.hex(Theme.colors.primary, props.activeStory) +
        (props.activeChapter ? Chalk.dim(' · Cap: ') + Chalk.hex(Theme.colors.text, props.activeChapter) : '');
      lines.push(padEndVisible(`${logo3}${activeCtx}`, width));
    } else if (isFullMode) {
      lines.push(padEndVisible(logo3, width));
    }

    // Línea separadora sutil
    lines.push(Chalk.hex(Theme.colors.surfaceBorder, '─'.repeat(width)));
    return lines;
  }
}
