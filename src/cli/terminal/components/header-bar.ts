import { Theme, Chalk } from '../theme';
import { ResponsiveLayoutConfig } from '../responsive';

export interface CloudHeaderState {
  version: string;
  user: string;
  isAuthenticated?: boolean;
  isConnected?: boolean;
  serverUrl?: string;
  serverOnline?: boolean;
  activeStory?: string | null;
  activeChapter?: string | null;
  syncState?: string;
  wordConnected?: boolean;
  notepadConnected?: boolean;
  googleConnected?: boolean;
}

export type HeaderState = CloudHeaderState;

export class HeaderBarRenderer {
  public static render(state: CloudHeaderState, config: ResponsiveLayoutConfig): string[] {
    const lines: string[] = [];
    const b = Theme.borders;
    const width = config.width;
    const contentWidth = Math.max(30, width - 2);

    const logo = Chalk.bgHex(Theme.colors.primary, Chalk.bold(Chalk.hex(Theme.colors.white, ' WATTPAD CLI ')));
    const versionStr = Chalk.dim(`v${state.version}`);

    const statusDot = state.serverOnline
      ? Chalk.hex(Theme.colors.success, '● Cloud')
      : Chalk.hex(Theme.colors.warning, '○ Offline');

    const userBadge = state.isAuthenticated
      ? Chalk.hex(Theme.colors.info, `@${state.user}`)
      : Chalk.dim('Invitado');

    if (config.compactHeader) {
      // 1-line compact header for small windows
      const left = `${logo} ${versionStr} │ ${statusDot}`;
      const right = `${userBadge} `;
      const rawLeftLen = 13 + state.version.length + 1 + 9;
      const rawRightLen = state.user.length + 2;
      const spaces = Math.max(1, width - rawLeftLen - rawRightLen);
      lines.push(`${left}${' '.repeat(spaces)}${right}`);
      lines.push(Chalk.hex(Theme.colors.surfaceBorder, b.horizontal.repeat(width)));
      return lines;
    }

    // 2-line modern header
    const topBar = `${b.topLeft}${b.horizontal.repeat(width - 2)}${b.topRight}`;
    lines.push(Chalk.hex(Theme.colors.surfaceBorder, topBar));

    // Line 1: Logo, server, user
    const serverLabel = Chalk.dim(state.serverUrl.replace('https://', ''));
    const line1Left = ` ${logo} ${versionStr} │ ${statusDot} (${serverLabel})`;
    const line1Right = `${userBadge} │ Sync: ${Chalk.hex(Theme.colors.cyan, state.syncState)} `;
    const rawLen1Left = 14 + state.version.length + 3 + 7 + 2 + state.serverUrl.replace('https://', '').length + 1;
    const rawLen1Right = state.user.length + 10 + state.syncState.length + 1;
    const pad1 = Math.max(1, width - 2 - rawLen1Left - rawLen1Right);
    lines.push(
      `${Chalk.hex(Theme.colors.surfaceBorder, b.vertical)}${line1Left}${' '.repeat(pad1)}${line1Right}${Chalk.hex(Theme.colors.surfaceBorder, b.vertical)}`
    );

    // Line 2: Active context
    const storyPart = state.activeStory
      ? `${Chalk.bold('Novela Activa:')} ${Chalk.hex(Theme.colors.primary, state.activeStory)}`
      : Chalk.dim('Sin novela activa (/story open NOV-xxxx)');
    const chapterPart = state.activeChapter
      ? ` │ ${Chalk.bold('Capítulo:')} ${Chalk.hex(Theme.colors.cyan, state.activeChapter)}`
      : '';
    const line2Text = ` ${storyPart}${chapterPart}`;
    const rawLen2 = (state.activeStory ? 15 + state.activeStory.length : 38) + (state.activeChapter ? 12 + state.activeChapter.length : 0);
    const pad2 = Math.max(1, width - 2 - rawLen2);
    lines.push(
      `${Chalk.hex(Theme.colors.surfaceBorder, b.vertical)}${line2Text}${' '.repeat(pad2)}${Chalk.hex(Theme.colors.surfaceBorder, b.vertical)}`
    );

    const bottomBar = `${b.bottomLeft}${b.horizontal.repeat(width - 2)}${b.bottomRight}`;
    lines.push(Chalk.hex(Theme.colors.surfaceBorder, bottomBar));

    return lines;
  }
}
