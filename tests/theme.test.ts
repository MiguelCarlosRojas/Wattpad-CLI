import { describe, expect, it } from 'bun:test';
import { Theme, Chalk, hexToRgb } from '../src/platform/terminal/theme';

describe('Theme & TrueColor Visual Engine', () => {
  it('should parse hex to RGB correctly', () => {
    const rgb = hexToRgb(Theme.colors.primary); // #FF6122
    expect(rgb.r).toBe(255);
    expect(rgb.g).toBe(97);
    expect(rgb.b).toBe(34);
  });

  it('should generate 24-bit TrueColor ANSI codes for Wattpad Orange', () => {
    const styled = Chalk.hex(Theme.colors.primary, 'WATTPAD');
    expect(styled).toContain('\x1b[38;2;255;97;34m');
    expect(styled).toContain('WATTPAD');
    expect(styled).toContain('\x1b[0m');
  });

  it('should generate high-contrast selection background', () => {
    const text = '› NOV-0002 El último invierno';
    const highlighted = Chalk.bgHex(Theme.colors.selectedBg, Chalk.bold(Chalk.hex(Theme.colors.selectedText, text)));
    expect(highlighted).toContain('\x1b[48;2;255;97;34m');
    expect(highlighted).toContain('\x1b[38;2;255;255;255m');
    expect(highlighted).toContain('› NOV-0002');
  });

  it('should format badges with high-contrast colored backgrounds', () => {
    const wattpadBadge = Theme.badges.wattpad('PUBLICADO');
    expect(wattpadBadge).toContain('\x1b[48;2;255;97;34m');
    expect(wattpadBadge).toContain('PUBLICADO');

    const successBadge = Theme.badges.success('SINCRONIZADO');
    expect(successBadge).toContain('\x1b[48;2;40;167;69m');
    expect(successBadge).toContain('SINCRONIZADO');
  });
});
