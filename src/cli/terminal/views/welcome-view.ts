import { Story } from '../../../shared/types';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface WelcomeScreenProps {
  version?: string;
  serverOnline?: boolean;
  user?: string;
  stories: Story[];
  selectedIndex?: number;
}

export class WelcomeScreen {
  public static render(props: WelcomeScreenProps, width: number): string[] {
    const lines: string[] = [];
    const contentWidth = Math.min(width, 84);

    // 1. Wattpad Brand Header
    lines.push('');
    const brand = Chalk.bold(Chalk.hex(Theme.colors.primary, '  Wattpad'));
    const studioBadge = Chalk.hex(Theme.colors.textSecondary, '·  AI WRITING STUDIO');
    const cloudStatus = props.serverOnline !== false
      ? Chalk.hex(Theme.colors.success, '● cloud')
      : Chalk.hex(Theme.colors.warning, '○ offline');
    const ver = Chalk.dim(`v${props.version || '1.1.0'}`);

    const headerLine = `  ${brand}  ${studioBadge}    ${ver}  ${cloudStatus}`;
    lines.push(padEndVisible(headerLine, width));
    lines.push('');

    // 2. Creative Greeting & Inspiring Subtitle
    lines.push(padEndVisible(`  ${Chalk.hex(Theme.colors.textSecondary, 'Tu espacio para crear historias.')}`, width));
    lines.push('');
    lines.push(padEndVisible(`  ${Chalk.bold(Chalk.hex(Theme.colors.white, '¿Qué vamos a escribir hoy?'))}`, width));
    lines.push('');

    // 3. Quick Action Chips (Minimalist, no bulky boxes)
    const actions = [
      { key: '1', label: 'Crear nueva historia', cmd: '/story new' },
      { key: '2', label: 'Continuar escribiendo', cmd: '/chapters' },
      { key: '3', label: 'Explorar mi biblioteca', cmd: '/library' },
    ];

    let actionRow = '  ';
    for (const act of actions) {
      const chip = `${Chalk.hex(Theme.colors.primary, `[ ${act.label} ]`)}   `;
      actionRow += chip;
    }
    lines.push(padEndVisible(actionRow, width));
    lines.push('');

    // 4. Recent Real Projects
    lines.push(padEndVisible(`  ${Chalk.hex(Theme.colors.textSecondary, Chalk.bold('Recientes'))}`, width));
    lines.push('');

    if (!props.stories || props.stories.length === 0) {
      lines.push(padEndVisible(`    ${Chalk.dim('Sin proyectos aún. Escribe /story new para comenzar tu primera novela.')}`, width));
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
          ? Chalk.hex(Theme.colors.primary, '●')
          : story.status === 'synced'
          ? Chalk.hex(Theme.colors.success, '●')
          : Chalk.hex(Theme.colors.warning, '○');

        const line = `  ${marker}${titleStyled}   ${genreTag}  ${statusDot}`;
        lines.push(padEndVisible(line, width));
      }
    }

    lines.push('');
    // 5. Subtle Divider
    const dividerLen = Math.min(width - 4, 60);
    lines.push(padEndVisible(`  ${Chalk.hex(Theme.colors.surfaceBorder, '─'.repeat(dividerLen))}`, width));
    lines.push('');

    return lines;
  }
}
