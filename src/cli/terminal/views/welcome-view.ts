import { Story } from '../../../shared/types';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface WelcomeScreenProps {
  version?: string;
  serverOnline?: boolean;
  user?: string;
  isAuthenticated?: boolean;
  stories: Story[];
  selectedIndex?: number;
}

export class WelcomeScreen {
  public static render(props: WelcomeScreenProps, width: number): string[] {
    const lines: string[] = [];

    // 1. Wattpad Brand Header
    lines.push('');
    const brand = Chalk.bold(Chalk.hex(Theme.colors.primary, '  Wattpad CLI'));
    const ver = Chalk.dim(`v${props.version || '1.1.0'}`);
    const cloudStatus = props.serverOnline !== false
      ? Chalk.hex(Theme.colors.success, '● cloud postgres')
      : Chalk.hex(Theme.colors.warning, '○ modo local');

    const headerLine = `  ${brand}    ${ver}  ${cloudStatus}`;
    lines.push(padEndVisible(headerLine, width));
    lines.push(padEndVisible(`  ${Chalk.hex(Theme.colors.surfaceBorder, '─'.repeat(Math.min(width - 4, 76)))}`, width));
    lines.push('');

    // 2. Inspiring Subtitle & Account Status
    lines.push(padEndVisible(`  ${Chalk.bold(Chalk.hex(Theme.colors.text, 'Gestor integral de novelas, capítulos y manuscritos desde la terminal.'))}`, width));

    let accountStatusLine: string;
    if (props.isAuthenticated && props.user) {
      accountStatusLine = `  ${Chalk.dim('Cuenta Wattpad:')} ${Chalk.hex(Theme.colors.primary, `@${props.user}`)} ${Chalk.hex(Theme.colors.success, '● Conectada')}  ${Chalk.dim('(Usa /account o /logout)')}`;
    } else {
      accountStatusLine = `  ${Chalk.dim('Cuenta Wattpad:')} ${Chalk.hex(Theme.colors.warning, '○ Modo Local / Desconectado')} — ${Chalk.dim('Inicia sesión con')} ${Chalk.hex(Theme.colors.primary, '/login')} ${Chalk.dim('o crea tu cuenta con')} ${Chalk.hex(Theme.colors.primary, '/register')}`;
    }
    lines.push(padEndVisible(accountStatusLine, width));
    lines.push('');

    // 3. Quick Action Chips
    lines.push(padEndVisible(`  ${Chalk.dim(Chalk.bold('ACCIONES RECOMENDADAS'))}`, width));
    const actions = [
      { key: '1', label: 'Ver novelas', cmd: '/stories' },
      { key: '2', label: 'Crear novela', cmd: '/story new' },
      { key: '3', label: 'Mis capítulos', cmd: '/chapters' },
      { key: '4', label: 'Documentos', cmd: '/documents' },
      { key: '5', label: 'Conexión editores', cmd: '/connect' },
      { key: '6', label: 'Publicaciones', cmd: '/publish status' },
    ];

    let actionRow = '  ';
    for (const act of actions) {
      const chip = `${Chalk.hex(Theme.colors.primary, `[${act.key}]`)} ${Chalk.hex(Theme.colors.textSecondary, act.label)}  `;
      if (stripAnsi(actionRow + chip).length > width - 4) {
        lines.push(padEndVisible(actionRow, width));
        actionRow = '  ' + chip;
      } else {
        actionRow += chip;
      }
    }
    if (actionRow.trim().length > 0) {
      lines.push(padEndVisible(actionRow, width));
    }
    lines.push('');

    // 4. Recent Real Stories
    lines.push(padEndVisible(`  ${Chalk.dim(Chalk.bold('NOVELAS RECIENTES'))}`, width));

    if (!props.stories || props.stories.length === 0) {
      lines.push(padEndVisible(`    ${Chalk.dim('Sin novelas creadas aún. Escribe /story new "Título" para comenzar.')}`, width));
    } else {
      const displayStories = props.stories.slice(0, 5);
      for (let i = 0; i < displayStories.length; i++) {
        const story = displayStories[i];
        const isSelected = props.selectedIndex === i;

        const marker = isSelected ? Chalk.bold(Chalk.hex(Theme.colors.primary, '› ')) : '  ';
        const titleStr = story.title;
        const titleStyled = isSelected
          ? Chalk.bold(Chalk.hex(Theme.colors.white, titleStr))
          : Chalk.hex(Theme.colors.text, titleStr);

        const genreTag = Chalk.dim(`[${story.genre || 'General'}]`);
        const statusDot = story.status === 'published'
          ? Chalk.hex(Theme.colors.primary, '● Publicada')
          : story.status === 'synced'
          ? Chalk.hex(Theme.colors.success, '● Sincronizada')
          : Chalk.hex(Theme.colors.warning, '○ Borrador');

        const line = `  ${marker}${titleStyled}   ${genreTag}   ${statusDot}  ${Chalk.dim(`(${story.editorPreference.toUpperCase()})`)}`;
        lines.push(padEndVisible(line, width));
      }
    }

    lines.push('');
    // 5. Subtle Divider
    const dividerLen = Math.min(width - 4, 76);
    lines.push(padEndVisible(`  ${Chalk.hex(Theme.colors.surfaceBorder, '─'.repeat(dividerLen))}`, width));

    return lines;
  }
}
