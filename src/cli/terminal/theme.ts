export interface ColorRgb {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): ColorRgb {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export class Chalk {
  public static isColorSupported(): boolean {
    if (typeof process !== 'undefined' && process.env && process.env.NO_COLOR) {
      return false;
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

  public static inverse(text: string): string {
    if (!Chalk.isColorSupported()) return text;
    return `\x1b[7m${text}\x1b[0m`;
  }
}

export const Theme = {
  colors: {
    // Signature Wattpad Orange
    primary: '#FF6122',
    orangeSecondary: '#FF7849',

    // Sleek dark surfaces
    background: '#0D1117',
    surface: '#151A21',
    surfaceBorder: '#27272A',
    divider: '#30363D',

    // High-contrast clean typography
    white: '#FFFFFF',
    text: '#F3F4F6',
    textSecondary: '#A1A1AA',
    muted: '#71717A',

    // Selection
    selectedBg: '#FF6122',
    selectedText: '#FFFFFF',

    // Status & semantics
    success: '#32D583',
    error: '#F97066',
    warning: '#FEC84B',
    info: '#60A5FA', // Technical blue
    cyan: '#00D2D3',
    purple: '#A855F7',
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
    muted: (text: string) => `\x1b[48;2;39;39;42m\x1b[38;2;161;161;170m ${text} \x1b[0m`,
  },
};
