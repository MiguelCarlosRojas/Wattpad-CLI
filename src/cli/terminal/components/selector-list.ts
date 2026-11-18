import { SelectorItem } from '../focus-manager';
import { Theme, Chalk } from '../theme';

export class SelectorList {
  private items: SelectorItem[] = [];
  private selectedIndex: number = 0;
  private scrollOffset: number = 0;
  private title: string = '';
  private maxVisibleItems: number = 7;

  constructor(title: string = 'SELECCIONA UNA OPCIÓN', items: SelectorItem[] = []) {
    this.title = title;
    this.items = items;
  }

  public setItems(items: SelectorItem[]): void {
    this.items = items;
    this.selectedIndex = 0;
    this.scrollOffset = 0;
  }

  public getItems(): SelectorItem[] {
    return this.items;
  }

  public getSelectedItem(): SelectorItem | null {
    if (this.items.length === 0) return null;
    return this.items[this.selectedIndex] || null;
  }

  public getSelectedIndex(): number {
    return this.selectedIndex;
  }

  public navigateUp(): void {
    if (this.items.length === 0) return;
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      if (this.selectedIndex < this.scrollOffset) {
        this.scrollOffset = this.selectedIndex;
      }
    }
  }

  public navigateDown(): void {
    if (this.items.length === 0) return;
    if (this.selectedIndex < this.items.length - 1) {
      this.selectedIndex++;
      if (this.selectedIndex >= this.scrollOffset + this.maxVisibleItems) {
        this.scrollOffset = this.selectedIndex - this.maxVisibleItems + 1;
      }
    }
  }

  public render(width: number = 80, isFocused: boolean = true): string[] {
    const lines: string[] = [];
    if (this.items.length === 0) return [];

    const total = this.items.length;
    const current = this.selectedIndex + 1;
    const posTag = `(${current}/${total})`;
    const focusTag = isFocused ? Chalk.hex(Theme.colors.primary, ' [ACTIVO]') : Chalk.dim(' [TAB PARA ENFOCAR]');

    // Header title with item position
    lines.push(`  ${Chalk.bold(Chalk.hex(Theme.colors.text, this.title))} ${Chalk.hex(Theme.colors.muted, posTag)}${focusTag}`);

    // Scroll up indicator
    if (this.scrollOffset > 0) {
      lines.push(Chalk.hex(Theme.colors.muted, `    ▲ (${this.scrollOffset} más arriba)`));
    }

    // Visible window
    const visibleSlice = this.items.slice(this.scrollOffset, this.scrollOffset + this.maxVisibleItems);

    for (let i = 0; i < visibleSlice.length; i++) {
      const itemIndex = this.scrollOffset + i;
      const item = visibleSlice[i];
      const isSelected = itemIndex === this.selectedIndex;
      const badgeStr = item.badge ? ` ${Chalk.hex(Theme.colors.info, `[${item.badge}]`)}` : '';

      if (isSelected && isFocused) {
        // High-contrast Orange badge pill ` › ` + bold white text
        // Contains both '›' and '\x1b[48;2;255;97;34m' without painting the entire line
        const orangePill = `\x1b[48;2;255;97;34m\x1b[38;2;255;255;255m\x1b[1m › \x1b[0m`;
        const itemLabel = Chalk.bold(Chalk.hex(Theme.colors.white, item.primary)) + badgeStr;
        lines.push(` ${orangePill} ${itemLabel}`);

        if (item.secondary) {
          lines.push(`     ${Chalk.hex(Theme.colors.orangeSecondary, item.secondary)}`);
        }
      } else if (isSelected && !isFocused) {
        // Selected but not focused
        const marker = Chalk.hex(Theme.colors.primary, '  › ');
        const itemLabel = Chalk.bold(Chalk.hex(Theme.colors.text, item.primary)) + badgeStr;
        lines.push(`${marker}${itemLabel}`);

        if (item.secondary) {
          lines.push(`     ${Chalk.hex(Theme.colors.muted, item.secondary)}`);
        }
      } else {
        // Normal unselected item
        const itemLabel = Chalk.hex(Theme.colors.textSecondary, item.primary) + badgeStr;
        lines.push(`    ${itemLabel}`);

        if (item.secondary) {
          lines.push(`     ${Chalk.hex(Theme.colors.muted, item.secondary)}`);
        }
      }
    }

    // Scroll down indicator
    const remainingBelow = this.items.length - (this.scrollOffset + visibleSlice.length);
    if (remainingBelow > 0) {
      lines.push(Chalk.hex(Theme.colors.muted, `    ▼ (${remainingBelow} más abajo)`));
    }

    // Footer helper
    const helper = isFocused
      ? '  ↑↓ Navegar · Enter Seleccionar · Esc Cancelar · Tab Cambiar Foco'
      : '  Tab para activar navegación por flechas';
    lines.push(Chalk.hex(Theme.colors.muted, helper));

    return lines;
  }
}
