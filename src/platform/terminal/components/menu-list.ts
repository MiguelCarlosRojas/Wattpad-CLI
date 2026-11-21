import { COLORS } from '../../../shared/constants/colors.constants';
import { MenuItem } from '../../../shared/types/navigation.types';

export class MenuListComponent {
  public static render(items: MenuItem[], selectedIndex: number, indent: number = 4): string[] {
    const lines: string[] = [];

    items.forEach((item, index) => {
      const isSelected = index === selectedIndex;
      const prefix = isSelected ? `${COLORS.ORANGE}❯${COLORS.RESET} ` : '  ';
      const labelColor = isSelected ? `${COLORS.BOLD}${COLORS.TEXT_MAIN}` : COLORS.TEXT_MUTED;

      let line = `${' '.repeat(indent)}${prefix}${labelColor}${item.label}${COLORS.RESET}`;

      if (item.badge) {
        const badgeColor = item.badgeColor || COLORS.TEXT_DIM;
        line += `   ${badgeColor}${item.badge}${COLORS.RESET}`;
      }

      lines.push(line);

      if (item.subtitle) {
        const subColor = isSelected ? COLORS.TEXT_MUTED : COLORS.TEXT_DIM;
        lines.push(`${' '.repeat(indent + 4)}${subColor}${item.subtitle}${COLORS.RESET}`);
      }
    });

    return lines;
  }
}
