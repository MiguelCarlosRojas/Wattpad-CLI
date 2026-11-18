import { Chapter, Story } from '../../../shared/types';
import { Theme, Chalk, padEndVisible } from '../theme';
import { EmptyState } from '../components/states';

export interface ChapterViewProps {
  story: Story;
  chapters: Chapter[];
  selectedIndex: number;
}

export class ChapterView {
  public static render(props: ChapterViewProps, width: number): string[] {
    const lines: string[] = [];

    lines.push('');
    lines.push(padEndVisible(`  ${Chalk.bold(Chalk.hex(Theme.colors.text, `Capítulos: ${props.story.title}`))}`, width));
    lines.push(padEndVisible(`  ${Chalk.dim(`ID: ${props.story.id}  │  ${props.chapters.length} capítulos registrados en Wattpad Cloud`)}`, width));
    lines.push(padEndVisible(`  ${Chalk.dim('Enter abre el archivo de trabajo en tu procesador de texto preferido.')}`, width));
    lines.push('');

    if (props.chapters.length === 0) {
      return EmptyState.render(
        'Sin capítulos en esta novela',
        'Crea el primer capítulo para comenzar la redacción.',
        `Escribe /chapter new ${props.story.id} "Capítulo 1" para crearlo.`,
        width
      );
    }

    for (let i = 0; i < props.chapters.length; i++) {
      const c = props.chapters[i];
      const isSelected = i === props.selectedIndex;

      let statusBadge: string;
      if (c.status === 'published') {
        statusBadge = Chalk.hex(Theme.colors.primary, '[PUBLICADO]');
      } else if (c.status === 'synced') {
        statusBadge = Chalk.hex(Theme.colors.success, '[SINCRONIZADO]');
      } else {
        statusBadge = Chalk.hex(Theme.colors.warning, '[BORRADOR]');
      }

      const prefix = isSelected
        ? Chalk.bold(Chalk.hex(Theme.colors.primary, '› '))
        : '  ';

      const heading = isSelected
        ? Chalk.bold(Chalk.hex(Theme.colors.white, `Capítulo ${c.chapterNumber}: ${c.title}`))
        : Chalk.hex(Theme.colors.text, `Capítulo ${c.chapterNumber}: ${c.title}`);

      lines.push(padEndVisible(`${prefix}${heading}  ${statusBadge}`, width));
      lines.push(padEndVisible(`    ${Chalk.dim(`ID: ${c.id}  │  ${c.wordCount} palabras  │  Actualizado: ${new Date(c.updatedAt).toLocaleDateString()}`)}`, width));
      lines.push('');
    }

    return lines;
  }
}
