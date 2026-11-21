import { COLORS } from '../../../shared/constants/colors.constants';
import { MenuItem } from '../../../shared/types/navigation.types';

export interface MenuListOptions {
  /** Margen lateral izquierdo en espacios (por defecto: 2) */
  indent?: number;
  /** Si debe incluir una línea en blanco entre opciones consecutivas (por defecto: true) */
  extraSpacing?: boolean;
}

export class MenuListComponent {
  public static render(
    items: MenuItem[],
    selectedIndex: number,
    options: MenuListOptions | number = {}
  ): string[] {
    const opts: MenuListOptions = typeof options === 'number' ? { indent: options } : options;
    const indent = opts.indent !== undefined ? opts.indent : 2;
    const extraSpacing = opts.extraSpacing !== undefined ? opts.extraSpacing : true;

    const lines: string[] = [];
    const margin = ' '.repeat(indent);

    items.forEach((item, index) => {
      const isSelected = index === selectedIndex;
      const pointer = isSelected ? `${COLORS.ORANGE}❯${COLORS.RESET} ` : '  ';
      const labelColor = isSelected ? `${COLORS.BOLD}${COLORS.TEXT_MAIN}` : COLORS.TEXT_MUTED;

      let line = `${margin}${pointer}${labelColor}${item.label}${COLORS.RESET}`;

      if (item.badge) {
        const badgeColor = item.badgeColor || COLORS.TEXT_DIM;
        line += `   ${badgeColor}${item.badge}${COLORS.RESET}`;
      }

      lines.push(line);

      if (item.subtitle) {
        const subColor = isSelected ? COLORS.TEXT_MUTED : COLORS.TEXT_DIM;
        // Sangría uniforme debajo de la opción (margen + 4 espacios = columna de la descripción)
        lines.push(`${margin}    ${subColor}${item.subtitle}${COLORS.RESET}`);
      }

      if (extraSpacing && index < items.length - 1) {
        lines.push('');
      }
    });

    return lines;
  }
}
