import { DiscoveredStory, DiscoveryFilter } from '../../wattpad/discovery.types';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface DiscoveryViewProps {
  stories: DiscoveredStory[];
  filter?: DiscoveryFilter;
  query?: string;
  width: number;
}

export class DiscoveryView {
  public static render(props: DiscoveryViewProps): string[] {
    const lines: string[] = [];
    const width = Math.max(50, props.width || 80);
    const innerWidth = width - 4;

    const topBorder = Chalk.hex(Theme.colors.surfaceBorder, `╭─ `) +
      Chalk.bold(Chalk.hex(Theme.colors.primary, `DESCUBRIR NOVELAS EN WATTPAD`)) +
      Chalk.hex(Theme.colors.surfaceBorder, ` ${'─'.repeat(Math.max(2, width - 34))}╮`);
    lines.push(topBorder);

    const sub = `Explora y lee novelas reales de Wattpad directamente desde tu terminal`;
    lines.push(
      Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
      padEndVisible(Chalk.dim(sub), innerWidth) +
      Chalk.hex(Theme.colors.surfaceBorder, ' │')
    );

    const helpLine = `Comandos: /discover · /search <texto o filtros> · /search "novelas de misterio en español terminadas"`;
    lines.push(
      Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
      padEndVisible(Chalk.hex(Theme.colors.info, helpLine), innerWidth) +
      Chalk.hex(Theme.colors.surfaceBorder, ' │')
    );

    if (props.filter) {
      const parts: string[] = [];
      if (props.filter.query) parts.push(`Consulta: "${props.filter.query}"`);
      if (props.filter.genre) parts.push(`Género: ${props.filter.genre}`);
      if (props.filter.status && props.filter.status !== 'all') {
        parts.push(`Estado: ${props.filter.status === 'completed' ? 'Terminada' : 'En curso'}`);
      }
      if (props.filter.minReads) parts.push(`Mín. lecturas: ${props.filter.minReads.toLocaleString()}`);

      const filterStr = parts.join('  ·  ');
      if (filterStr) {
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.hex(Theme.colors.warning, `Filtros activos: ${filterStr}`), innerWidth) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      }
    }

    lines.push(Chalk.hex(Theme.colors.surfaceBorder, `├${'─'.repeat(width - 2)}┤`));

    if (props.stories.length === 0) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim('No se encontraron novelas con los criterios especificados.'), innerWidth) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim('Intenta con otros términos, por ejemplo: /search misterio --completed'), innerWidth) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    } else {
      props.stories.forEach((story, idx) => {
        const num = `[${idx + 1}]`;
        const titleStr = Chalk.bold(Chalk.hex(Theme.colors.primary, `${num} ${story.title}`));
        const authorStr = Chalk.hex(Theme.colors.textSecondary, `por @${story.author.username}`);
        const statusBadge = story.status === 'completed'
          ? Chalk.hex(Theme.colors.success, '[COMPLETADA]')
          : Chalk.hex(Theme.colors.warning, '[EN CURSO]');

        const headerLine = `${titleStr}  ${authorStr}  ${statusBadge}`;
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(headerLine, innerWidth) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );

        const reads = (story.readCount || 0).toLocaleString();
        const votes = (story.voteCount || 0).toLocaleString();
        const parts = story.numParts || 1;
        const genre = story.genre || 'General';
        const metaLine = Chalk.dim(`   Género: ${genre}  |  Lecturas: ${reads}  |  Votos: ${votes}  |  Capítulos: ${parts}`);
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(metaLine, innerWidth) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );

        if (story.description) {
          const maxDescLen = innerWidth - 6;
          const cleanDesc = story.description.replace(/\s+/g, ' ').trim();
          const descLine = cleanDesc.length > maxDescLen ? cleanDesc.slice(0, maxDescLen - 3) + '...' : cleanDesc;
          lines.push(
            Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
            padEndVisible(Chalk.italic(Chalk.hex(Theme.colors.muted, `   ${descLine}`)), innerWidth) +
            Chalk.hex(Theme.colors.surfaceBorder, ' │')
          );
        }

        const urlLine = Chalk.dim(`   Enlace Wattpad: `) + Chalk.underline(Chalk.hex(Theme.colors.info, story.url));
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(urlLine, innerWidth) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );

        if (idx < props.stories.length - 1) {
          lines.push(
            Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
            padEndVisible(Chalk.hex(Theme.colors.surfaceBorder, '  · · ·'), innerWidth) +
            Chalk.hex(Theme.colors.surfaceBorder, ' │')
          );
        }
      });
    }

    const bottomBorder = Chalk.hex(Theme.colors.surfaceBorder, `╰${'─'.repeat(width - 2)}╯`);
    lines.push(bottomBorder);

    return lines;
  }
}
