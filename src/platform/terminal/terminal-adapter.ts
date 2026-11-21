import { COLORS } from '../../shared/constants/colors.constants';

/**
 * Adaptador de bajo nivel para la consola y pantalla de terminal
 */
export class TerminalAdapter {
  private static altBufferActive = false;

  public static getWidth(): number {
    return process.stdout.columns || 80;
  }

  public static getHeight(): number {
    return process.stdout.rows || 24;
  }

  public static enterAltBuffer(): void {
    if (!this.altBufferActive && process.stdout.isTTY) {
      process.stdout.write('\x1b[?1049h\x1b[?25l'); // Switch to alternate buffer and hide cursor
      this.altBufferActive = true;
    }
  }

  public static exitAltBuffer(): void {
    if (this.altBufferActive && process.stdout.isTTY) {
      process.stdout.write('\x1b[?25h\x1b[?1049l'); // Show cursor and restore buffer
      this.altBufferActive = false;
    }
  }

  public static clearScreen(): void {
    process.stdout.write(COLORS.CLEAR_SCREEN);
  }

  public static showCursor(): void {
    process.stdout.write(COLORS.SHOW_CURSOR);
  }

  public static hideCursor(): void {
    process.stdout.write(COLORS.HIDE_CURSOR);
  }
}
