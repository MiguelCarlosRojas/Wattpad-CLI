import { Story } from '../../../shared/types';
import { Theme, Chalk, padEndVisible } from '../theme';
import { EmptyState } from '../components/states';

export interface LibraryViewProps {
  stories: Story[];
  selectedIndex: number;
  chaptersCountByStoryId: Record<string, number>;
}

export class LibraryView {
  public static render(props: LibraryViewProps, width: number): string[] {
    const lines: string[] = [];

    lines.push('');
    lines.push(padEndVisible(`  ${Chalk.bold(Chalk.hex(Theme.colors.text, 'Biblioteca de Novelas'))}  ${Chalk.dim(`(${props.stories.length} títulos)`)}`, width));
    lines.push(padEndVisible(`  ${Chalk.dim('Usa ↑↓ para navegar, Enter para abrir o establecer contexto.')}`, width));
    lines.push('');

    if (props.stories.length === 0) {
      return EmptyState.render(
        'Tu biblioteca está vacía',
        'Aún no has creado novelas en Wattpad Cloud.',
        'Escribe /story new "Título" para comenzar.',
        width
      );
    }

    for (let i = 0; i < props.stories.length; i++) {
      const s = props.stories[i];
      const isSelected = i === props.selectedIndex;
      const count = props.chaptersCountByStoryId[s.id] || 0;

      let statusBadge: string;
      if (s.status === 'published') {
        statusBadge = Chalk.hex(Theme.colors.primary, '[PUBLICADO]');
      } else if (s.status === 'synced') {
        statusBadge = Chalk.hex(Theme.colors.success, '[SINCRONIZADO]');
      } else {
        statusBadge = Chalk.hex(Theme.colors.warning, '[BORRADOR]');
      }

      const prefix = isSelected
        ? Chalk.bold(Chalk.hex(Theme.colors.primary, '› '))
        : '  ';

      const title = isSelected
        ? Chalk.bold(Chalk.hex(Theme.colors.white, `${s.id}  ${s.title}`))
        : Chalk.hex(Theme.colors.text, `${s.id}  ${s.title}`);

      lines.push(padEndVisible(`${prefix}${title}  ${statusBadge}`, width));
      lines.push(padEndVisible(`    ${Chalk.dim(`Género: ${s.genre}  │  ${count} capítulos  │  Editor: ${s.editorPreference.toUpperCase()}`)}`, width));
      if (s.description) {
        const desc = s.description.length > 70 ? s.description.slice(0, 69) + '…' : s.description;
        lines.push(padEndVisible(`    ${Chalk.dim(desc)}`, width));
      }
      lines.push('');
    }

    return lines;
  }
}
