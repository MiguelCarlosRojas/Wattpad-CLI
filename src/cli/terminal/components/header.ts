import { ResponsiveLayoutConfig } from '../responsive';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface HeaderProps {
  version: string;
  user: string;
  isAuthenticated: boolean;
  serverUrl: string;
  serverOnline: boolean;
  activeStory?: string | null;
  activeChapter?: string | null;
}

export class Header {
  public static render(props: HeaderProps, config: ResponsiveLayoutConfig): string[] {
    const lines: string[] = [];

    const brand = Chalk.bold(Chalk.hex(Theme.colors.primary, 'WATTPAD')) + Chalk.dim(' │ ') + Chalk.hex(Theme.colors.text, 'AI Writing Studio');
    const version = Chalk.dim(`v${props.version}`);
    const statusDot = props.serverOnline
      ? Chalk.hex(Theme.colors.success, '●') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Cloud: Conectado')
      : Chalk.hex(Theme.colors.warning, '○') + ' ' + Chalk.hex(Theme.colors.textSecondary, 'Modo Desconectado');
    const userBadge = props.isAuthenticated
      ? Chalk.hex(Theme.colors.textSecondary, `@${props.user}`)
      : Chalk.dim('Invitado');

    if (config.isCompact) {
      // 1-line ultra-compact header
      const left = `${brand} ${version}`;
      const right = props.serverOnline ? Chalk.hex(Theme.colors.success, '●') : Chalk.hex(Theme.colors.warning, '○');
      const spacer = ' '.repeat(Math.max(1, config.width - stripAnsi(left).length - stripAnsi(right).length));
      lines.push(`${left}${spacer}${right}`);
      lines.push(Chalk.hex(Theme.colors.surfaceBorder, '─'.repeat(config.width)));
      return lines;
    }

    // Full studio header bar
    const leftPart = `${brand}  ${version}`;
    const rightPart = `${statusDot}  ${Chalk.dim('│')}  ${userBadge}`;

    const padSpaces = Math.max(2, config.width - stripAnsi(leftPart).length - stripAnsi(rightPart).length);
    lines.push(`${leftPart}${' '.repeat(padSpaces)}${rightPart}`);

    // Context subline if story is active
    if (props.activeStory) {
      const storyInfo = Chalk.dim('Novela activa: ') + Chalk.hex(Theme.colors.primary, props.activeStory) +
        (props.activeChapter ? Chalk.dim('  •  Capítulo: ') + Chalk.hex(Theme.colors.text, props.activeChapter) : '');
      lines.push(padEndVisible(storyInfo, config.width));
    }

    lines.push(Chalk.hex(Theme.colors.surfaceBorder, '─'.repeat(config.width)));
    return lines;
  }
}
