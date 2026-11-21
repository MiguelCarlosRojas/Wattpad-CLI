import { COLORS } from '../../shared/constants/colors.constants';

export interface TerminalDimensions {
  columns: number;
  rows: number;
}

/**
 * Adaptador de bajo nivel para la consola, pantalla y eventos de redimensionamiento
 */
export class TerminalAdapter {
  private static altBufferActive = false;
  private static resizeListener: (() => void) | null = null;

  public static getWidth(): number {
    return Math.max(40, process.stdout.columns || 80);
  }

  public static getHeight(): number {
    return Math.max(12, process.stdout.rows || 24);
  }

  public static getDimensions(): TerminalDimensions {
    return {
      columns: this.getWidth(),
      rows: this.getHeight(),
    };
  }

  public static enterAltBuffer(): void {
    if (!this.altBufferActive && process.stdout.isTTY) {
      process.stdout.write('\x1b[?1049h\x1b[?25l'); // Cambia a buffer alternativo y oculta el cursor
      this.altBufferActive = true;
    }
  }

  public static exitAltBuffer(): void {
    if (this.altBufferActive && process.stdout.isTTY) {
      process.stdout.write('\x1b[?25h\x1b[?1049l'); // Muestra el cursor y restaura buffer principal
      this.altBufferActive = false;
    }
  }

  public static clearScreen(): void {
    process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
  }

  public static showCursor(): void {
    process.stdout.write(COLORS.SHOW_CURSOR);
  }

  public static hideCursor(): void {
    process.stdout.write(COLORS.HIDE_CURSOR);
  }

  /**
   * Registra la escucha centralizada de redimensionamiento de la terminal
   */
  public static onResize(callback: (dimensions: TerminalDimensions) => void): void {
    this.removeResizeListener();

    this.resizeListener = () => {
      const dimensions = this.getDimensions();
      callback(dimensions);
    };

    process.stdout.on('resize', this.resizeListener);

    if (process.platform !== 'win32') {
      try {
        process.on('SIGWINCH', this.resizeListener);
      } catch {}
    }
  }

  /**
   * Remueve los listeners de redimensionamiento para evitar fugas de memoria
   */
  public static removeResizeListener(): void {
    if (this.resizeListener) {
      process.stdout.removeListener('resize', this.resizeListener);
      if (process.platform !== 'win32') {
        try {
          process.removeListener('SIGWINCH', this.resizeListener);
        } catch {}
      }
      this.resizeListener = null;
    }
  }
}
