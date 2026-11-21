import { COLORS } from '../../../shared/constants/colors.constants';
import { divider } from '../../../shared/utils/ansi';

export class FooterComponent {
  public static render(hints: string[] = ['↑↓ Navegar', 'Enter Seleccionar', 'Esc Volver', 'Ctrl+C Salir'], width: number = 80): string[] {
    const lines: string[] = [];
    lines.push('');
    lines.push(divider(width));

    const formattedHints = hints.map((h) => {
      const parts = h.split(' ');
      const key = parts[0];
      const desc = parts.slice(1).join(' ');
      return `${COLORS.ORANGE}${key}${COLORS.RESET} ${COLORS.TEXT_MUTED}${desc}${COLORS.RESET}`;
    });

    lines.push(`  ${formattedHints.join('   ')}`);
    return lines;
  }
}
