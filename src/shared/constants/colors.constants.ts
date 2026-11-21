/**
 * Paleta de colores oficial de Wattpad CLI
 * Diseñada para terminales modernas con soporte ANSI 24-bit TrueColor.
 */
export const COLORS = {
  // Wattpad Brand
  ORANGE: '\x1b[38;2;255;97;34m',       // #FF6122
  ORANGE_BG: '\x1b[48;2;255;97;34m',    // Fondo Naranja
  ORANGE_DIM: '\x1b[38;2;200;75;25m',   // Naranja atenuado

  // Superficies oscuras
  BG_DARK: '\x1b[48;2;13;13;15m',       // #0D0D0F Fondo principal
  BG_SECONDARY: '\x1b[48;2;23;23;27m',  // #17171B Fondo secundario
  BORDER: '\x1b[38;2;41;41;47m',        // #29292F Bordes
  BORDER_FOCUS: '\x1b[38;2;255;97;34m',  // Borde enfocado

  // Tipografía
  TEXT_MAIN: '\x1b[38;2;245;245;245m',  // #F5F5F5 Texto principal
  TEXT_MUTED: '\x1b[38;2;161;161;170m', // #A1A1AA Texto secundario
  TEXT_DIM: '\x1b[38;2;113;113;122m',   // #71717A Texto atenuado

  // Estados semánticos
  SUCCESS: '\x1b[38;2;16;185;129m',     // #10B981 Verde
  WARNING: '\x1b[38;2;245;158;11m',     // #F59E0B Ámbar / Borrador
  ERROR: '\x1b[38;2;239;68;68m',        // #EF4444 Rojo
  INFO: '\x1b[38;2;59;130;246m',        // #3B82F6 Azul
  PURPLE: '\x1b[38;2;168;85;247m',      // #A855F7 Púrpura

  // Controles ANSI básicos
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
  DIM: '\x1b[2m',
  ITALIC: '\x1b[3m',
  UNDERLINE: '\x1b[4m',
  INVERSE: '\x1b[7m',
  CLEAR_LINE: '\x1b[2K\r',
  CLEAR_SCREEN: '\x1b[2J\x1b[H',
  HIDE_CURSOR: '\x1b[?25l',
  SHOW_CURSOR: '\x1b[?25h',
};
