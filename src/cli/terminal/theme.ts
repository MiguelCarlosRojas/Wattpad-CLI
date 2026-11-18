export interface ColorRgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): ColorRgb {
  if (!hex || typeof hex !== 'string') {
    return { r: 255, g: 97, b: 34 };
  }
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

export function visibleLength(str: string): string {
  return stripAnsi(str);
}

export function padEndVisible(str: string, targetLength: number, padChar: string = ' '): string {
  const currentLen = stripAnsi(str).length;
  if (currentLen >= targetLength) return str;
  return str + padChar.repeat(targetLength - currentLen);
}

export function truncateVisible(str: string, maxLength: number): string {
  const plain = stripAnsi(str);
  if (plain.length <= maxLength) return str;
  return plain.slice(0, Math.max(0, maxLength - 1)) + '…';
}

export class Chalk {
  public static isColorSupported(): boolean {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env.NO_COLOR && process.env.NO_COLOR !== '0') {
        return false;
      }
      if (process.env.TERM === 'dumb') {
        return false;
      }
    }
    return true;
  }

  public static rgb(r: number, g: number, b: number, text: string): string {
    if (!Chalk.isColorSupported()) return text;
    return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
  }

  public static bgRgb(r: number, g: number, b: number, text: string): string {
    if (!Chalk.isColorSupported()) return text;
    return `\x1b[48;2;${r};${g};${b}m${text}\x1b[0m`;
  }

  public static hex(hexColor: string, text: string): string {
    if (!Chalk.isColorSupported()) return text;
    const { r, g, b } = hexToRgb(hexColor);
    return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
  }

  public static bgHex(hexColor: string, text: string): string {
    if (!Chalk.isColorSupported()) return text;
    const { r, g, b } = hexToRgb(hexColor);
    return `\x1b[48;2;${r};${g};${b}m${text}\x1b[0m`;
  }

  public static bold(text: string): string {
    if (!Chalk.isColorSupported()) return text;
    return `\x1b[1m${text}\x1b[0m`;
  }

  public static dim(text: string): string {
    if (!Chalk.isColorSupported()) return text;
    return `\x1b[2m${text}\x1b[0m`;
  }

  public static italic(text: string): string {
    if (!Chalk.isColorSupported()) return text;
    return `\x1b[3m${text}\x1b[0m`;
  }

  public static underline(text: string): string {
    if (!Chalk.isColorSupported()) return text;
    return `\x1b[4m${text}\x1b[0m`;
  }

  public static inverse(text: string): string {
    if (!Chalk.isColorSupported()) return text;
    return `\x1b[7m${text}\x1b[0m`;
  }
}

export const Theme = {
  colors: {
    // Exact official palette:
    primary: '#FF6122',         // Wattpad Orange (Accento elegante)
    orangeSecondary: '#FF7849',
    background: '#0D1117',      // Fondo oscuro studio
    surface: '#151A21',         // Superficies limpias
    surfaceBorder: '#21262D',   // Separadores ultra sutiles
    divider: '#30363D',

    // Tipografía terminal legible y contrastada:
    white: '#FFFFFF',
    text: '#F3F4F6',            // Texto principal
    textSecondary: '#A1A1AA',   // Texto secundario
    muted: '#71717A',           // Metadatos y atajos

    // Selección interactiva:
    selectedBg: '#FF6122',
    selectedText: '#FFFFFF',

    // Semántica de estado:
    success: '#32D583',         // Éxito
    error: '#F97066',           // Error
    warning: '#FEC84B',         // Advertencia
    info: '#60A5FA',            // Información / Azul técnico
    purple: '#A855F7',          // AI Models
  },
  symbols: {
    arrow: '›',
    bullet: '•',
    dot: '●',
    check: '✓',
    cross: '✕',
    info: 'ℹ',
    sync: '↻',
    sparkle: '✦',
    book: '📖',
    folder: '📁',
  },
  borders: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│',
    cross: '┼',
    teeDown: '┬',
    teeUp: '┴',
  },
  badges: {
    wattpad: (text: string) => `\x1b[48;2;255;97;34m\x1b[38;2;255;255;255m\x1b[1m ${text} \x1b[0m`,
    success: (text: string) => `\x1b[48;2;40;167;69m\x1b[38;2;255;255;255m\x1b[1m ${text} \x1b[0m`,
    warning: (text: string) => `\x1b[48;2;255;193;7m\x1b[38;2;0;0;0m\x1b[1m ${text} \x1b[0m`,
    error: (text: string) => `\x1b[48;2;249;112;102m\x1b[38;2;255;255;255m\x1b[1m ${text} \x1b[0m`,
    info: (text: string) => `\x1b[48;2;96;165;250m\x1b[38;2;0;0;0m\x1b[1m ${text} \x1b[0m`,
    model: (text: string) => `\x1b[48;2;168;85;247m\x1b[38;2;255;255;255m\x1b[1m ${text} \x1b[0m`,
    muted: (text: string) => `\x1b[48;2;33;38;45m\x1b[38;2;161;161;170m ${text} \x1b[0m`,
  },
};
