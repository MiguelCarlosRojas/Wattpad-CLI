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
    const width = config.width;
    const isCompact = config.width < 75 || config.compactHeader;

    const brandName = Chalk.bold(Chalk.hex(Theme.colors.primary, 'Wattpad')) + ' ' + Chalk.bold(Chalk.hex(Theme.colors.white, 'Studio'));
    const statusDot = state.serverOnline
      ? Chalk.hex(Theme.colors.success, '● ') + Chalk.hex(Theme.colors.text, 'Cloud Connected')
      : Chalk.hex(Theme.colors.warning, '○ ') + Chalk.hex(Theme.colors.textSecondary, 'Offline');

    const userBadge = state.isAuthenticated
      ? `@${state.user}`
      : 'Invitado';

    if (isCompact) {
      // 1-line ultra-clean header for small windows
      const left = ` ${brandName} ${Chalk.dim('·')} ${Chalk.hex(Theme.colors.muted, 'AI Writing Studio')}`;
      const right = `${statusDot} `;
      const rawLeftLen = 15 + 3 + 17;
      const rawRightLen = 17;
      const spaces = Math.max(1, width - rawLeftLen - rawRightLen);
      lines.push(`${left}${' '.repeat(spaces)}${right}`);
      lines.push(Chalk.hex(Theme.colors.divider, '─'.repeat(width)));
      return lines;
    }

    // Modern 2-line minimalist studio header (Claude/Antigravity style)
    // Row 1: Brand title & Cloud status
    const row1Left = `  ${brandName}`;
    const row1Right = `${statusDot}  `;
    const rawLen1 = 16 + 18;
    const pad1 = Math.max(1, width - rawLen1);
    lines.push(`${row1Left}${' '.repeat(pad1)}${row1Right}`);

    // Row 2: Subtitle & Context / Session
    let row2Subtitle = 'AI Writing Studio';
    if (state.activeStory) {
      row2Subtitle += ` · ${state.activeStory}`;
    }
    const row2Left = `  ${Chalk.hex(Theme.colors.textSecondary, row2Subtitle)}`;

    const syncLabel = state.syncState ? ` · ${state.syncState}` : '';
    const row2Meta = `v${state.version} · ${userBadge}${syncLabel}`;
    const row2Right = `${Chalk.hex(Theme.colors.muted, row2Meta)}  `;
    const rawLen2 = 2 + row2Subtitle.length + row2Meta.length + 2;
    const pad2 = Math.max(1, width - rawLen2);
    lines.push(`${row2Left}${' '.repeat(pad2)}${row2Right}`);

    // Row 3: Subtle horizontal divider
    lines.push(Chalk.hex(Theme.colors.divider, '─'.repeat(width)));

    return lines;
  }
}
