export type RenderMode = 'fullscreen' | 'inline';

export class TerminalAdapter {
  private static mode: RenderMode = 'fullscreen';
  private static inAlternateBuffer = false;

  public static setMode(mode: RenderMode): void {
    this.mode = mode;
  }

  public static getMode(): RenderMode {
    return this.mode;
  }

  public static enterSession(): void {
    if (this.mode === 'fullscreen') {
      // Enter alternate screen buffer & hide cursor during setup
      process.stdout.write('\x1b[?1049h\x1b[H\x1b[?25h');
      this.inAlternateBuffer = true;
    } else {
      // Inline mode: Ensure clean new line in standard scrollback
      process.stdout.write('\n');
      this.inAlternateBuffer = false;
    }
  }

  public static leaveSession(): void {
    if (this.inAlternateBuffer) {
      // Leave alternate screen buffer & restore normal buffer & cursor
      process.stdout.write('\x1b[?1049l\x1b[?25h\n');
      this.inAlternateBuffer = false;
    } else {
      process.stdout.write('\x1b[?25h\n');
    }
  }

  public static renderBuffer(content: string): void {
    if (this.mode === 'fullscreen') {
      // Redraw frame cleanly at top-left
      process.stdout.write('\x1b[H\x1b[2J' + content);
    } else {
      // Inline mode: append cleanly
      process.stdout.write(content + '\n');
    }
  }

  public static clearLine(): void {
    process.stdout.write('\x1b[2K\r');
  }

  public static hideCursor(): void {
    process.stdout.write('\x1b[?25l');
  }

  public static showCursor(): void {
    process.stdout.write('\x1b[?25h');
  }
}
