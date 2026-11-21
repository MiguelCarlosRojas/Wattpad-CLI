import { APP_VERSION } from '../../../core/config/config';
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
  activePath?: string | null;
  mode?: 'completa' | 'compacta' | 'zen';
}

export class Header {
  public static render(props: HeaderProps, config: ResponsiveLayoutConfig): string[] {
    const lines: string[] = [];
    const width = Math.max(50, config.width || 80);
    const mode = props.mode || 'completa';
    const versionStr = props.version || APP_VERSION;

    // Modo ZEN: Ultra minimalista, una sola línea elegante
    if (mode === 'zen') {
      const brand = Chalk.bold(Chalk.hex(Theme.colors.primary, 'WATTPAD CLI'));
      const version = Chalk.dim(`v${versionStr}`);
      const userText = props.isAuthenticated && props.user
        ? Chalk.hex(Theme.colors.success, `● @${props.user.replace(/^@/, '')}`)
        : Chalk.dim('○ Sin conexión');
      const zenLine = `${brand} ${version}  ·  ${userText}`;
      lines.push(padEndVisible(zenLine, width));
      lines.push(Chalk.hex(Theme.colors.surfaceBorder, '─'.repeat(width)));
      return lines;
    }

    // Logotipo icónico oficial Wattpad v1.0.1 (No recortar, deformar ni sustituir)
    const logo1 = Chalk.bold(Chalk.hex(Theme.colors.primary, '██╗    ██╗     '));
    const logo2 = Chalk.bold(Chalk.hex(Theme.colors.primary, '██║ █╗ ██║     '));
    const logo3 = Chalk.bold(Chalk.hex(Theme.colors.primary, '╚███╔███╔╝     '));
    const logoPrefixLen = 15; // 10 chars logo + 5 spaces

    // Línea 1: WATTPAD CLI v1.0.1 [+ status a la derecha si hay espacio]
    const brand = Chalk.bold(Chalk.hex(Theme.colors.primary, 'WATTPAD CLI'));
    const version = Chalk.dim(`v${versionStr}`);
    const titleText = `${brand} ${version}`;

    let rightStatus = '';
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

    const availableL1 = width - logoPrefixLen - stripAnsi(titleText).length - stripAnsi(rightStatus).length;
    let line1Content: string;
    if (availableL1 >= 2) {
      line1Content = `${titleText}${' '.repeat(availableL1)}${rightStatus}`;
    } else {
      line1Content = titleText;
    }
    lines.push(padEndVisible(`${logo1}${line1Content}`, width));

    // Línea 2: Cuenta / Usuario / Estado
    let line2Content: string;
    if (props.isAuthenticated) {
      if (props.profileVerified === false) {
        line2Content = Chalk.hex(Theme.colors.warning, 'Cuenta: No se pudo verificar el perfil');
      } else if (props.user && props.user !== 'Desconectado' && props.user !== 'Sin conectar') {
        const rawUser = props.user.startsWith('@') ? props.user.slice(1) : props.user;
        const displayName = props.displayName || (props.serverOnline ? 'Wattpad conectado ◉' : 'Conectado');
        const userPart = `@${rawUser}`;
        const dotSep = Chalk.dim('·');
        line2Content = Chalk.dim('Cuenta: ') + Chalk.hex(Theme.colors.text, userPart) + ` ${dotSep} ` + Chalk.hex(Theme.colors.success, displayName);
      } else {
        line2Content = Chalk.hex(Theme.colors.warning, 'Cuenta: No se pudo verificar el perfil');
      }
    } else {
      line2Content = Chalk.dim('Sin conexión · Ejecuta /login');
    }
    lines.push(padEndVisible(`${logo2}${line2Content}`, width));

    // Línea 3: Contexto activo o ruta de documentos ~/Documents/Wattpad/Novelas
    let line3Content: string;
    if (props.activeStory) {
      const storyName = Chalk.hex(Theme.colors.primary, props.activeStory);
      const chapterPart = props.activeChapter ? Chalk.dim(' · Cap: ') + Chalk.hex(Theme.colors.text, props.activeChapter) : '';
      line3Content = Chalk.dim('Novela: ') + storyName + chapterPart;
    } else {
      const pathText = props.activePath || '~/Documents/Wattpad/Novelas';
      line3Content = Chalk.hex(Theme.colors.textSecondary, pathText);
    }
    lines.push(padEndVisible(`${logo3}${line3Content}`, width));

    // Línea 4: Separador horizontal sutil
    lines.push(Chalk.hex(Theme.colors.surfaceBorder, '─'.repeat(width)));
    return lines;
  }
}
