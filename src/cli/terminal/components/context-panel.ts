import { Theme, Chalk } from '../theme';
import { CloudHeaderState } from './header-bar';

export class ContextPanelRenderer {
  public static readonly WIDTH = 26;

  public static render(state: CloudHeaderState, height: number = 20): string[] {
    const lines: string[] = [];

    const formatHeader = (text: string) => Chalk.bold(Chalk.hex(Theme.colors.muted, text));

    lines.push('');
    lines.push(` ${formatHeader('ESTUDIO CLOUD')}`);
    const cloudStatus = state.serverOnline
      ? `  ${Chalk.hex(Theme.colors.success, '●')} Conectado`
      : `  ${Chalk.hex(Theme.colors.warning, '○')} Desconectado`;
    lines.push(cloudStatus);
    lines.push(`  ${Chalk.hex(Theme.colors.muted, 'wattpad-cli.render')}`);

    lines.push('');
    lines.push(` ${formatHeader('AUTOR')}`);
    const authorName = state.user || 'Invitado';
    lines.push(`  @${Chalk.hex(Theme.colors.text, authorName)}`);

    lines.push('');
    lines.push(` ${formatHeader('PROYECTO ACTIVO')}`);
    if (state.activeStory) {
      lines.push(`  ${Chalk.bold(Chalk.hex(Theme.colors.primary, state.activeStory))}`);
      if (state.activeChapter) {
        lines.push(`  ${Chalk.hex(Theme.colors.textSecondary, state.activeChapter)}`);
      }
    } else {
      lines.push(`  ${Chalk.hex(Theme.colors.muted, 'Sin novela activa')}`);
      lines.push(`  ${Chalk.dim('/story open')}`);
    }

    lines.push('');
    lines.push(` ${formatHeader('SINCRONIZACIÓN')}`);
    const syncText = state.syncState || 'Al día';
    lines.push(`  ${Chalk.hex(Theme.colors.success, '●')} ${syncText}`);
    lines.push(`  ${Chalk.hex(Theme.colors.muted, 'PostgreSQL Cloud')}`);

    while (lines.length < height) {
      lines.push('');
    }

    return lines.slice(0, height);
  }
}
