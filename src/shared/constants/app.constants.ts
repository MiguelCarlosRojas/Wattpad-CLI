import { env } from '../config/env.config';

/**
 * Constantes generales de Wattpad CLI
 */
export const APP_CONSTANTS = {
  NAME: 'WATTPAD CLI',
  VERSION: '1.0.0',
  TAGLINE: 'Terminal de escritura',
  DESCRIPTION: 'Tu espacio para crear historias',
  DEFAULT_WIDTH: 80,
  MIN_WIDTH: 70,
  MIN_HEIGHT: 20,
  WATTPAD_BASE_URL: env.WATTPAD_BASE_URL,
  WATTPAD_API_BASE: env.WATTPAD_API_BASE,
  USER_DATA_DIR_NAME: '.wattpad',
  DIVIDER_CHAR: '─',
};

export const ASCII_LOGO = [
  '██╗    ██╗',
  '██║ █╗ ██║',
  '╚███╔███╔╝',
];
