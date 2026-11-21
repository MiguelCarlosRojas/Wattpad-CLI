import { COLORS } from '../../../shared/constants/colors.constants';
import { TerminalAdapter } from '../terminal-adapter';

/**
 * Renderizador de terminal ANSI con prevención de parpadeos
 */
export class AnsiRenderer {
  private static lastOutput: string = '';

  public static render(lines: string[]): void {
    const fullText = lines.join('\n');
    if (fullText === this.lastOutput) return;

    this.lastOutput = fullText;

    // Reposiciona el cursor al inicio (1,1) y escribe el buffer completo
    process.stdout.write(`\x1b[H\x1b[?25l${fullText}\x1b[J`);
  }

  public static forceRepaint(lines: string[]): void {
    this.lastOutput = '';
    TerminalAdapter.clearScreen();
    this.render(lines);
  }
}
