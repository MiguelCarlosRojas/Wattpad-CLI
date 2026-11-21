import { TerminalAdapter } from '../terminal-adapter';
import { visibleLength, truncate } from '../../../shared/utils/ansi';

export interface TerminalDimensions {
  columns: number;
  rows: number;
}

export interface ScreenLayout {
  width: number;
  height: number;
  contentStartRow: number;
  contentStartColumn: number;
  footerRow: number;
}

/**
 * Renderizador centralizado de terminal ANSI con prevención de superposición,
 * borrado estricto de residuos por línea (\x1b[K) y dimensionamiento adaptable.
 */
export class AnsiRenderer {
  private static lastOutput: string = '';

  public static getDimensions(): TerminalDimensions {
    return TerminalAdapter.getDimensions();
  }

  public static getLayout(): ScreenLayout {
    const dim = this.getDimensions();
    return {
      width: dim.columns,
      height: dim.rows,
      contentStartRow: 6,
      contentStartColumn: 2,
      footerRow: Math.max(8, dim.rows - 2),
    };
  }

  /**
   * Invalida el buffer anterior para forzar el redibujado completo
   */
  public static reset(): void {
    this.lastOutput = '';
  }

  /**
   * Dibuja el frame completo garantizando que cada línea borre hasta el final
   * de la fila y que la última fila no cause scroll en la terminal.
   */
  public static render(lines: string[]): void {
    const dim = this.getDimensions();
    const width = dim.columns;
    const height = dim.rows;

    // Altura útil segura (height - 1) para evitar el salto de scroll al final del buffer
    const targetRowCount = Math.max(8, height - 1);

    // Ajustar número de líneas exactamente al alto útil
    const frameLines: string[] = [];
    for (let i = 0; i < targetRowCount; i++) {
      const rawLine = i < lines.length ? lines[i] || '' : '';
      const vLen = visibleLength(rawLine);

      let cleanLine = rawLine;
      // Truncar para prevenir desbordamientos que rompan la alineación
      if (vLen >= width) {
        cleanLine = truncate(rawLine, width - 1);
      }

      // \x1b[K borra desde el cursor hasta el final de la fila en pantalla,
      // eliminando completamente cualquier texto residual de vistas anteriores.
      frameLines.push(`${cleanLine}\x1b[K`);
    }

    const fullBuffer = frameLines.join('\n');
    if (fullBuffer === this.lastOutput) {
      return;
    }

    this.lastOutput = fullBuffer;

    // Reposiciona el cursor en (1,1), asegura cursor oculto, imprime frame y limpia fondo restante (\x1b[J)
    process.stdout.write(`\x1b[H\x1b[?25l${fullBuffer}\x1b[J`);
  }

  /**
   * Limpia la pantalla físicamente y redibuja la vista activa de manera inmediata
   */
  public static forceRepaint(lines: string[]): void {
    this.reset();
    TerminalAdapter.clearScreen();
    this.render(lines);
  }
}
