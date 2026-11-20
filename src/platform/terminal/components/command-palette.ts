import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';
import { CommandDefinition } from '../../../core/types/command.types';

export interface CommandPaletteProps {
  query: string;
  selectedIndex: number;
  commands: CommandDefinition[];
  width: number;
}

export class CommandPalette {
  public static render(props: CommandPaletteProps): string[] {
    const lines: string[] = [];
    const totalWidth = Math.max(50, props.width);
    const boxWidth = Math.min(totalWidth - 4, 76);
    const leftPad = Math.max(0, Math.floor((totalWidth - boxWidth) / 2));
    const padPrefix = ' '.repeat(leftPad);

    const borderColor = Theme.colors.primary;

    // Header border
    const titleText = ' PALETA DE COMANDOS WATTPAD ';
    const topBarLength = Math.max(2, boxWidth - 3 - titleText.length);
    const topBorder =
      Chalk.hex(borderColor, Theme.borders.topLeft + Theme.borders.horizontal) +
      Chalk.bold(Chalk.hex(Theme.colors.primary, titleText)) +
      Chalk.hex(borderColor, Theme.borders.horizontal.repeat(topBarLength) + Theme.borders.topRight);
    lines.push(padPrefix + topBorder);

    const padRow = (content: string) => {
      const plainLen = stripAnsi(content).length;
      const padSpaces = Math.max(0, boxWidth - 2 - plainLen);
      return (
        padPrefix +
        Chalk.hex(borderColor, Theme.borders.vertical) +
        content +
        ' '.repeat(padSpaces) +
        Chalk.hex(borderColor, Theme.borders.vertical)
      );
    };

    // Search input row
    const prompt = Chalk.bold(Chalk.hex(Theme.colors.primary, ' ❯ Buscar comando: '));
    const cursor = Chalk.inverse(' ');
    const queryText = Chalk.hex(Theme.colors.text, props.query) + cursor;
    lines.push(padRow(`${prompt}${queryText}`));

    // Divider
    lines.push(
      padPrefix +
      Chalk.hex(
        borderColor,
        Theme.borders.teeDown + Theme.borders.horizontal.repeat(boxWidth - 2) + Theme.borders.teeDown
      )
    );

    // Filter commands
    const q = props.query.trim().toLowerCase().replace(/^\//, '');
    const filtered = props.commands.filter((cmd) => {
      const cleanName = cmd.name.toLowerCase().replace(/^\//, '');
      const desc = (cmd.description || '').toLowerCase();
      const cat = (cmd.category || '').toLowerCase();
      return cleanName.includes(q) || desc.includes(q) || cat.includes(q);
    });

    const maxItems = 7;
    const startIndex = Math.max(0, Math.min(props.selectedIndex - Math.floor(maxItems / 2), filtered.length - maxItems));
    const visibleItems = filtered.slice(startIndex, startIndex + maxItems);

    if (visibleItems.length === 0) {
      lines.push(padRow(`   ${Chalk.dim('No se encontraron comandos que coincidan con la búsqueda.')}`));
    } else {
      visibleItems.forEach((cmd, idx) => {
        const absoluteIndex = startIndex + idx;
        const isSelected = absoluteIndex === props.selectedIndex;

        const pointer = isSelected
          ? Chalk.bold(Chalk.hex(Theme.colors.primary, ' ▸ '))
          : Chalk.dim('   ');

        const cmdName = isSelected
          ? Chalk.bold(Chalk.hex(Theme.colors.primary, cmd.name.padEnd(16)))
          : Chalk.hex(Theme.colors.text, cmd.name.padEnd(16));

        const maxDescLen = Math.max(10, boxWidth - 26);
        const descText = (cmd.description || '').slice(0, maxDescLen);
        const cmdDesc = isSelected
          ? Chalk.hex(Theme.colors.text, descText)
          : Chalk.dim(descText);

        lines.push(padRow(`${pointer}${cmdName} ${cmdDesc}`));
      });
    }

    // Bottom border
    const footerText = ' ↑↓ Navegar · Enter Ejecutar · Esc Cerrar ';
    const bottomBarLength = Math.max(2, boxWidth - 3 - footerText.length);
    const bottomBorder =
      Chalk.hex(borderColor, Theme.borders.bottomLeft + Theme.borders.horizontal) +
      Chalk.dim(footerText) +
      Chalk.hex(borderColor, Theme.borders.horizontal.repeat(bottomBarLength) + Theme.borders.bottomRight);
    lines.push(padPrefix + bottomBorder);

    return lines;
  }
}
