import { Theme, Chalk } from '../theme';
import { RenderBlock } from '../../../types/command.types';

export interface WelcomeHeroState {
  version: string;
  serverUrl: string;
  serverOnline: boolean;
  username?: string;
  isAuthenticated?: boolean;
  activeStory?: string | null;
}

export class WelcomeHeroRenderer {
  public static render(state: WelcomeHeroState, width: number = 80): string[] {
    const lines: string[] = [];
    const b = Theme.borders;
    const contentWidth = Math.max(34, width - 4);
    const borderColor = Theme.colors.surfaceBorder;

    const logoLines = [
      '╦ ╦╔═╗╔╦╗╔╦╗╔═╗╔═╗╔╦╗   ╔═╗╦  ╦',
      '║║║╠═╣ ║  ║ ╠═╝╠═╣ ║║   ║  ║  ║',
      '╚╩╝╩ ╩ ╩  ╩ ╩  ╩ ╩═╩╝   ╚═╝╩═╝╩',
    ];

    // Card top border
    const titleTag = ' WATTPAD STUDIO • NEXT-GEN CLI ';
    const remainingTop = Math.max(0, contentWidth - titleTag.length);
    lines.push(
      Chalk.hex(borderColor, `${b.topLeft}${b.horizontal}`) +
        Chalk.hex(Theme.colors.primary, Chalk.bold(titleTag)) +
        Chalk.hex(borderColor, `${b.horizontal.repeat(remainingTop)}${b.topRight}`)
    );

    // Empty padding line
    lines.push(`${Chalk.hex(borderColor, b.vertical)}${' '.repeat(contentWidth + 2)}${Chalk.hex(borderColor, b.vertical)}`);

    // Render ASCII logo centered or left-padded
    for (const logoLine of logoLines) {
      const styledLogo = Chalk.hex(Theme.colors.primary, Chalk.bold(logoLine));
      const padRight = Math.max(0, contentWidth - logoLine.length - 2);
      lines.push(
        `${Chalk.hex(borderColor, b.vertical)}  ${styledLogo}${' '.repeat(padRight)}${Chalk.hex(borderColor, b.vertical)}`
      );
    }

    // Version and platform pill
    const versionBadge = Chalk.bgHex(Theme.colors.primary, Chalk.bold(Chalk.hex(Theme.colors.white, ` v${state.version} `)));
    const cloudBadge = state.serverOnline
      ? Chalk.bgHex(Theme.colors.success, Chalk.bold(Chalk.hex(Theme.colors.white, ' ● CLOUD ONLINE ')))
      : Chalk.bgHex(Theme.colors.warning, Chalk.bold(Chalk.hex(Theme.colors.white, ' ○ OFFLINE ')));
    const archBadge = Chalk.bgHex(Theme.colors.surface, Chalk.hex(Theme.colors.muted, ' POSTGRESQL + OBJECT STORAGE '));

    const badgesLine = `  ${versionBadge} ${cloudBadge} ${archBadge}`;
    const rawBadgesLen = 2 + (state.version.length + 4) + 1 + 16 + 1 + 29;
    const padBadges = Math.max(0, contentWidth - rawBadgesLen);
    lines.push(
      `${Chalk.hex(borderColor, b.vertical)}${badgesLine}${' '.repeat(padBadges)}${Chalk.hex(borderColor, b.vertical)}`
    );

    // Empty divider
    lines.push(`${Chalk.hex(borderColor, b.vertical)}${' '.repeat(contentWidth + 2)}${Chalk.hex(borderColor, b.vertical)}`);

    // Host & Author connection status
    const serverClean = state.serverUrl.replace(/^https?:\/\//, '');
    const userLabel = state.isAuthenticated && state.username ? `@${state.username}` : 'Invitado (usa /login)';
    const statusText = `  Conexión: ${Chalk.hex(Theme.colors.cyan, serverClean)}  │  Autor: ${Chalk.hex(Theme.colors.info, userLabel)}`;
    const rawStatusLen = 2 + 10 + serverClean.length + 5 + 7 + userLabel.length;
    const padStatus = Math.max(0, contentWidth - rawStatusLen);
    lines.push(
      `${Chalk.hex(borderColor, b.vertical)}${statusText}${' '.repeat(padStatus)}${Chalk.hex(borderColor, b.vertical)}`
    );

    // Active Story (if any)
    if (state.activeStory) {
      const storyText = `  Novela Activa: ${Chalk.hex(Theme.colors.primary, Chalk.bold(state.activeStory))}`;
      const rawStoryLen = 2 + 15 + state.activeStory.length;
      const padStory = Math.max(0, contentWidth - rawStoryLen);
      lines.push(
        `${Chalk.hex(borderColor, b.vertical)}${storyText}${' '.repeat(padStory)}${Chalk.hex(borderColor, b.vertical)}`
      );
    }

    // Quick Actions Header
    lines.push(`${Chalk.hex(borderColor, b.vertical)}${' '.repeat(contentWidth + 2)}${Chalk.hex(borderColor, b.vertical)}`);
    const chipHeader = `  ${Chalk.dim('ACCIONES RÁPIDAS (ejecuta cualquier comando con prefijo "/"):')}`;
    const rawChipHeaderLen = 2 + 63;
    const padChipHeader = Math.max(0, contentWidth - rawChipHeaderLen);
    lines.push(
      `${Chalk.hex(borderColor, b.vertical)}${chipHeader}${' '.repeat(padChipHeader)}${Chalk.hex(borderColor, b.vertical)}`
    );

    // Quick Action Chips
    const chips = ['/stories', '/chapters', '/sync', '/publish', '/connect', '/models', '/help'];
    const styledChips = chips
      .map((c) => Chalk.bgHex(Theme.colors.surface, Chalk.hex(Theme.colors.primary, Chalk.bold(` ${c} `))))
      .join(' ');
    const rawChipsLen = chips.reduce((acc, c) => acc + c.length + 2, 0) + (chips.length - 1);
    const padChips = Math.max(0, contentWidth - 2 - rawChipsLen);
    lines.push(
      `${Chalk.hex(borderColor, b.vertical)}  ${styledChips}${' '.repeat(padChips)}${Chalk.hex(borderColor, b.vertical)}`
    );

    // Footer tip
    lines.push(`${Chalk.hex(borderColor, b.vertical)}${' '.repeat(contentWidth + 2)}${Chalk.hex(borderColor, b.vertical)}`);
    const tipText = `  ${Chalk.dim('Tip:')} ${Chalk.hex(Theme.colors.text, 'Presiona')} ${Chalk.hex(Theme.colors.primary, 'Tab')} ${Chalk.hex(Theme.colors.text, 'para autocompletar sugerencias o')} ${Chalk.hex(Theme.colors.primary, '↑↓')} ${Chalk.hex(Theme.colors.text, 'para navegar.')}`;
    const rawTipLen = 2 + 5 + 9 + 4 + 43 + 3 + 17;
    const padTip = Math.max(0, contentWidth - rawTipLen);
    lines.push(
      `${Chalk.hex(borderColor, b.vertical)}${tipText}${' '.repeat(padTip)}${Chalk.hex(borderColor, b.vertical)}`
    );

    // Card bottom border
    lines.push(Chalk.hex(borderColor, `${b.bottomLeft}${b.horizontal.repeat(contentWidth + 2)}${b.bottomRight}`));

    return lines;
  }

  public static getWelcomeBlock(state: WelcomeHeroState): RenderBlock {
    const serverClean = state.serverUrl.replace(/^https?:\/\//, '');
    const userLabel = state.isAuthenticated && state.username ? `@${state.username}` : 'Invitado (usa /login)';

    return {
      type: 'card',
      title: 'WATTPAD CLI — NEXT-GEN STUDIO',
      subtitle: 'Entorno de desarrollo y publicación literaria en la nube (PostgreSQL + Object Storage)',
      statusBadge: state.serverOnline ? 'CLOUD READY' : 'OFFLINE',
      statusColor: state.serverOnline ? '#28A745' : '#FFC107',
      fields: [
        { label: 'Servidor Cloud', value: `https://${serverClean}` },
        { label: 'Autor / Sesión', value: userLabel },
        { label: 'Acciones Rápidas', value: '/stories │ /chapters │ /sync │ /publish │ /connect │ /models │ /help' },
        { label: 'Navegación', value: 'Tab (Autocompletar) │ ↑↓ (Navegar / Historial) │ Enter (Ejecutar)' },
      ],
    };
  }
}
