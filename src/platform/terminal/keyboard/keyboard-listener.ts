import { KeyPressEvent } from '../../../shared/types/navigation.types';

export class KeyboardListener {
  private static activeHandler: ((event: KeyPressEvent) => void) | null = null;
  private static isRaw: boolean = false;

  public static start(handler: (event: KeyPressEvent) => void): void {
    this.activeHandler = handler;

    if (!process.stdin.isTTY) return;

    if (!this.isRaw) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      this.isRaw = true;

      process.stdin.on('data', this.handleData);
    }
  }

  public static stop(): void {
    this.activeHandler = null;
    if (this.isRaw && process.stdin.isTTY) {
      process.stdin.removeListener('data', this.handleData);
      try {
        process.stdin.setRawMode(false);
        process.stdin.pause();
      } catch {}
      this.isRaw = false;
    }
  }

  private static handleData = (chunk: string | Buffer): void => {
    const str = chunk.toString();
    const event = KeyboardListener.parseKey(str);

    if (KeyboardListener.activeHandler) {
      KeyboardListener.activeHandler(event);
    }
  };

  public static parseKey(s: string): KeyPressEvent {
    // Ctrl + C
    if (s === '\x03') {
      return { key: 'c', ctrl: true, shift: false, alt: false, raw: s };
    }
    // Ctrl + P
    if (s === '\x10') {
      return { key: 'p', ctrl: true, shift: false, alt: false, raw: s };
    }
    // Enter
    if (s === '\r' || s === '\n' || s === '\r\n') {
      return { key: 'enter', ctrl: false, shift: false, alt: false, raw: s };
    }
    // Tab
    if (s === '\t') {
      return { key: 'tab', ctrl: false, shift: false, alt: false, raw: s };
    }
    // Shift + Tab
    if (s === '\x1b[Z') {
      return { key: 'tab', ctrl: false, shift: true, alt: false, raw: s };
    }
    // Escape
    if (s === '\x1b') {
      return { key: 'escape', ctrl: false, shift: false, alt: false, raw: s };
    }
    // Backspace
    if (s === '\x08' || s === '\x7f' || s === '\b') {
      return { key: 'backspace', ctrl: false, shift: false, alt: false, raw: s };
    }
    // Flecha Arriba
    if (s === '\x1b[A' || s === '\x1bOA') {
      return { key: 'up', ctrl: false, shift: false, alt: false, raw: s };
    }
    // Flecha Abajo
    if (s === '\x1b[B' || s === '\x1bOB') {
      return { key: 'down', ctrl: false, shift: false, alt: false, raw: s };
    }
    // Flecha Derecha
    if (s === '\x1b[C' || s === '\x1bOC') {
      return { key: 'right', ctrl: false, shift: false, alt: false, raw: s };
    }
    // Flecha Izquierda
    if (s === '\x1b[D' || s === '\x1bOD') {
      return { key: 'left', ctrl: false, shift: false, alt: false, raw: s };
    }

    return {
      key: s,
      ctrl: false,
      shift: false,
      alt: false,
      raw: s,
    };
  }
}
