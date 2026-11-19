import { ResponsiveLayoutConfig } from '../responsive';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface HeaderProps {
  version: string;
  user: string;
  isAuthenticated: boolean;
  serverUrl?: string;
  serverOnline?: boolean;
  activeStory?: string | null;
  activeChapter?: string | null;
}

export class Header {
  public static render(props: HeaderProps, config: ResponsiveLayoutConfig): string[] {
    const lines: string[] = [];
    const width = config.width || 80;

    // Line 1: WATTPAD CLI v1.0.0                                  ◉
    const brand = Chalk.bold(Chalk.hex(Theme.colors.primary, 'WATTPAD CLI'));
    const version = Chalk.dim(`v${props.version || '1.0.0'}`);
    const leftTitle = `${brand} ${version}`;
    const statusDot = props.isAuthenticated
      ? Chalk.hex(Theme.colors.success, '◉')
      : Chalk.dim('◉');

    const spaceCount = Math.max(1, width - stripAnsi(leftTitle).length - stripAnsi(statusDot).length);
    lines.push(`${leftTitle}${' '.repeat(spaceCount)}${statusDot}`);

    // Line 2: Account Status
    let accountStatusLine: string;
    if (props.isAuthenticated && props.user && props.user !== 'Desconectado' && props.user !== 'Sin conectar') {
      const username = props.user.startsWith('@') ? props.user : `@${props.user}`;
      accountStatusLine = `Cuenta: ${Chalk.hex(Theme.colors.primary, Chalk.bold(username))} · ${Chalk.hex(Theme.colors.success, 'Wattpad conectado')}`;
    } else {
      accountStatusLine = `Cuenta: ${Chalk.dim('Sin conectar')}`;
    }

    lines.push(padEndVisible(accountStatusLine, width));

    // Optional active context
    if (props.activeStory) {
      const storyInfo =
        Chalk.dim('Novela activa: ') +
        Chalk.hex(Theme.colors.primary, props.activeStory) +
        (props.activeChapter ? Chalk.dim(' · Capítulo: ') + Chalk.hex(Theme.colors.text, props.activeChapter) : '');
      lines.push(padEndVisible(storyInfo, width));
    }

    // Divider
    lines.push(Chalk.hex(Theme.colors.surfaceBorder, '─'.repeat(width)));
    return lines;
  }
}
