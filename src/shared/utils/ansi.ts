import { COLORS } from '../constants/colors.constants';

/**
 * Utilidades para manejo de cadenas ANSI y renderizado en terminal
 */

/**
 * Elimina secuencias de escape ANSI para calcular longitudes visibles reales
 */
export function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1b\].*?\x07/g, '');
}

/**
 * Calcula la longitud visible de una cadena en la terminal
 */
export function visibleLength(str: string): number {
  return stripAnsi(str).length;
}

/**
 * Trunca una cadena con puntos suspensivos respetando caracteres visibles
 */
export function truncate(str: string, maxLength: number): string {
  if (visibleLength(str) <= maxLength) return str;
  const raw = stripAnsi(str);
  if (maxLength <= 3) return raw.slice(0, maxLength);
  return raw.slice(0, maxLength - 1) + '…';
}

/**
 * Rellena una cadena a la derecha respetando caracteres ANSI
 */
export function padRight(str: string, targetLength: number): string {
  const current = visibleLength(str);
  if (current >= targetLength) return str;
  return str + ' '.repeat(targetLength - current);
}

/**
 * Rellena una cadena a la izquierda respetando caracteres ANSI
 */
export function padLeft(str: string, targetLength: number): string {
  const current = visibleLength(str);
  if (current >= targetLength) return str;
  return ' '.repeat(targetLength - current) + str;
}

/**
 * Centra una cadena dentro de un ancho determinado
 */
export function padCenter(str: string, targetLength: number): string {
  const current = visibleLength(str);
  if (current >= targetLength) return str;
  const left = Math.floor((targetLength - current) / 2);
  const right = targetLength - current - left;
  return ' '.repeat(left) + str + ' '.repeat(right);
}

/**
 * Crea una línea divisoria continua
 */
export function divider(width: number = 78, char: string = '─'): string {
  return `${COLORS.BORDER}${char.repeat(width)}${COLORS.RESET}`;
}
