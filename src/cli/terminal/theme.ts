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
  private static supportsTrueColor = true;

  public static rgb(r: number, g: number, b: number, text: string): string {
    return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
  }

  public static bgRgb(r: number, g: number, b: number, text: string): string {
    return `\x1b[48;2;${r};${g};${b}m${text}\x1b[0m`;
  }

  public static hex(hexColor: string, text: string): string {
    const { r, g, b } = hexToRgb(hexColor);
    return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
  }

  public static bgHex(hexColor: string, text: string): string {
    const { r, g, b } = hexToRgb(hexColor);
    return `\x1b[48;2;${r};${g};${b}m${text}\x1b[0m`;
  }

  public static bold(text: string): string {
    return `\x1b[1m${text}\x1b[0m`;
  }

  public static dim(text: string): string {
    return `\x1b[2m${text}\x1b[0m`;
  }

  public static italic(text: string): string {
    return `\x1b[3m${text}\x1b[0m`;
  }

  public static inverse(text: string): string {
    return `\x1b[7m${text}\x1b[0m`;
  }
}

export const Theme = {
  colors: {
    primary: '#FF6122', // Signature Wattpad Orange
    secondary: '#808080',
    white: '#FFFFFF',
    text: '#EDEDED',
    muted: '#7A7A7A',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceBorder: '#333333',
    selectedBg: '#FF6122',
    selectedText: '#FFFFFF',
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
    info: '#17A2B8',
    cyan: '#00D2D3',
    purple: '#9B59B6',
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
    error: (text: string) => `\x1b[48;2;220;53;69m\x1b[38;2;255;255;255m\x1b[1m ${text} \x1b[0m`,
    info: (text: string) => `\x1b[48;2;23;162;184m\x1b[38;2;255;255;255m\x1b[1m ${text} \x1b[0m`,
    muted: (text: string) => `\x1b[48;2;80;80;80m\x1b[38;2;230;230;230m ${text} \x1b[0m`,
  },
};
