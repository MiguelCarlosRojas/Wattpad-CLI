import { Story } from '../../../shared/types';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';
import { EmptyState } from '../components/states';

export interface HomeViewProps {
  stories: Story[];
  chaptersCountByStoryId: Record<string, number>;
  selectedIndex?: number;
  user?: string | null;
  isAuthenticated?: boolean;
}

export class HomeView {
  public static render(props: HomeViewProps, width: number): string[] {
    const lines: string[] = [];

    // Title and Subtitle (Minimalist typography)
    lines.push('');
    lines.push(padEndVisible(`  ${Chalk.bold(Chalk.hex(Theme.colors.primary, 'Wattpad CLI'))}  ${Chalk.dim('│  Gestión integral de novelas, capítulos y manuscritos')}`, width));

    let accountNotice: string;
    if (props.isAuthenticated && props.user) {
      accountNotice = `  ${Chalk.dim('Sesión Wattpad:')} ${Chalk.hex(Theme.colors.primary, `@${props.user}`)} ${Chalk.hex(Theme.colors.success, '● Conectada')}  ${Chalk.dim('(Usa /account o /logout)')}`;
    } else {
      accountNotice = `  ${Chalk.dim('Sesión Wattpad:')} ${Chalk.hex(Theme.colors.warning, '○ Modo Local / Desconectado')} — ${Chalk.dim('Inicia sesión con')} ${Chalk.hex(Theme.colors.primary, '/login')} ${Chalk.dim('o regístrate con')} ${Chalk.hex(Theme.colors.primary, '/register')}`;
    }
    lines.push(padEndVisible(accountNotice, width));
    lines.push('');

    // Recommended Actions Bar
    lines.push(padEndVisible(`  ${Chalk.dim(Chalk.bold('ACCIONES RÁPIDAS'))}`, width));
    const actions = [
      { key: '1', label: 'Ver novelas', cmd: '/stories' },
      { key: '2', label: 'Nueva novela', cmd: '/story new' },
      { key: '3', label: 'Mis capítulos', cmd: '/chapters' },
      { key: '4', label: 'Documentos', cmd: '/documents' },
      { key: '5', label: 'Editores Word/Notepad', cmd: '/connect' },
      { key: '6', label: 'Publicaciones', cmd: '/publish status' },
    ];

    let actionsRow = '  ';
    for (const act of actions) {
      const chip = `${Chalk.hex(Theme.colors.primary, `[${act.key}]`)} ${Chalk.hex(Theme.colors.textSecondary, act.label)}  `;
      if (stripAnsi(actionsRow + chip).length > width - 4) {
        lines.push(padEndVisible(actionsRow, width));
        actionsRow = '  ' + chip;
      } else {
        actionsRow += chip;
      }
    }
    if (actionsRow.trim().length > 0) {
      lines.push(padEndVisible(actionsRow, width));
    }
    lines.push('');

    // Recent Projects Section
    lines.push(padEndVisible(`  ${Chalk.dim(Chalk.bold('BIBLIOTECA DE NOVELAS'))}`, width));

    if (!props.stories || props.stories.length === 0) {
      const empty = EmptyState.render(
        'Sin novelas registradas',
        'Crea tu primera historia literaria en la terminal.',
        'Escribe /story new "Título de tu Novela" para comenzar.',
        width
      );
      lines.push(...empty);
    } else {
      // Table Header
      const headerLine = `  ${Chalk.dim('ID'.padEnd(10))} ${Chalk.dim('TÍTULO'.padEnd(28))} ${Chalk.dim('GÉNERO'.padEnd(14))} ${Chalk.dim('CAPS'.padEnd(8))} ${Chalk.dim('ESTADO')}`;
      lines.push(padEndVisible(headerLine, width));
      lines.push(padEndVisible(`  ${Chalk.hex(Theme.colors.surfaceBorder, '─'.repeat(Math.min(width - 4, 76)))}`, width));

      for (let i = 0; i < props.stories.length; i++) {
        const s = props.stories[i];
        const isSelected = props.selectedIndex === i;
        const count = props.chaptersCountByStoryId[s.id] || 0;

        let statusBadge: string;
        if (s.status === 'published') {
          statusBadge = Chalk.hex(Theme.colors.primary, '● Publicada');
        } else if (s.status === 'synced') {
          statusBadge = Chalk.hex(Theme.colors.success, '● Al día');
        } else {
          statusBadge = Chalk.hex(Theme.colors.warning, '○ Borrador');
        }

        const idCol = isSelected ? Chalk.bold(Chalk.hex(Theme.colors.primary, `› ${s.id}`.padEnd(10))) : Chalk.dim(`  ${s.id}`.padEnd(10));
        const titleStr = s.title.length > 25 ? s.title.slice(0, 24) + '…' : s.title;
        const titleCol = isSelected ? Chalk.bold(Chalk.hex(Theme.colors.white, titleStr.padEnd(28))) : Chalk.hex(Theme.colors.text, titleStr.padEnd(28));
        const genreCol = Chalk.dim(s.genre.padEnd(14));
        const capsCol = Chalk.dim(`${count} caps`.padEnd(8));

        lines.push(padEndVisible(`  ${idCol} ${titleCol} ${genreCol} ${capsCol} ${statusBadge}`, width));
      }
    }

    return lines;
  }
}
