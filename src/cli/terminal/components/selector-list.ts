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
    const b = Theme.borders;
    const contentWidth = Math.max(30, width - 4);

    if (this.items.length === 0) return [];

    // Header border
    const focusIndicator = isFocused ? ' [ACTIVO]' : ' [TAB PARA ENFOCAR]';
    const headerTitle = ` ${this.title}${focusIndicator} `;
    const topBarLen = Math.max(0, contentWidth - headerTitle.length);
    const borderColor = isFocused ? Theme.colors.primary : Theme.colors.surfaceBorder;

    lines.push(
      Chalk.hex(borderColor, `${b.topLeft}${b.horizontal}${headerTitle}${b.horizontal.repeat(topBarLen)}${b.topRight}`)
    );

    // Scroll up indicator
    if (this.scrollOffset > 0) {
      const moreUp = `  ▲ (${this.scrollOffset} más arriba)`;
      lines.push(`${Chalk.hex(borderColor, b.vertical)}${Chalk.dim(moreUp.padEnd(contentWidth + 2))}${Chalk.hex(borderColor, b.vertical)}`);
    }

    // Visible window
    const visibleSlice = this.items.slice(this.scrollOffset, this.scrollOffset + this.maxVisibleItems);

    for (let i = 0; i < visibleSlice.length; i++) {
      const itemIndex = this.scrollOffset + i;
      const item = visibleSlice[i];
      const isSelected = itemIndex === this.selectedIndex;

      let lineText = '';
      const badgeStr = item.badge ? ` [${item.badge}]` : '';

      if (isSelected && isFocused) {
        // High-contrast Orange background, bold white text, marker ›
        const label = ` › ${item.primary}${badgeStr} `;
        const padded = label.padEnd(contentWidth);
        const highlighted = Chalk.bgHex(Theme.colors.selectedBg, Chalk.bold(Chalk.hex(Theme.colors.selectedText, padded)));
        lineText = `${Chalk.hex(borderColor, b.vertical)} ${highlighted} ${Chalk.hex(borderColor, b.vertical)}`;
      } else if (isSelected && !isFocused) {
        // Selected but not focused
        const label = ` › ${item.primary}${badgeStr}`;
        const padded = label.padEnd(contentWidth);
        lineText = `${Chalk.hex(borderColor, b.vertical)} ${Chalk.hex(Theme.colors.primary, padded)} ${Chalk.hex(borderColor, b.vertical)}`;
      } else {
        // Normal item
        const label = `   ${item.primary}${badgeStr}`;
        const padded = label.padEnd(contentWidth);
        lineText = `${Chalk.hex(borderColor, b.vertical)} ${Chalk.hex(Theme.colors.text, padded)} ${Chalk.hex(borderColor, b.vertical)}`;
      }

      lines.push(lineText);

      // Optional secondary detail line
      if (item.secondary) {
        const secText = isSelected
          ? `     ${Chalk.italic(Chalk.hex(Theme.colors.selectedBg, item.secondary))}`
          : `     ${Chalk.dim(item.secondary)}`;
        const secPadded = secText.padEnd(contentWidth + (isSelected ? 18 : 8));
        lines.push(`${Chalk.hex(borderColor, b.vertical)}${secPadded}${Chalk.hex(borderColor, b.vertical)}`);
      }
    }

    // Scroll down indicator
    const remainingBelow = this.items.length - (this.scrollOffset + visibleSlice.length);
    if (remainingBelow > 0) {
      const moreDown = `  ▼ (${remainingBelow} más abajo)`;
      lines.push(`${Chalk.hex(borderColor, b.vertical)}${Chalk.dim(moreDown.padEnd(contentWidth + 2))}${Chalk.hex(borderColor, b.vertical)}`);
    }

    // Footer helper
    const helper = isFocused
      ? ' ↑↓ Navegar │ Enter Seleccionar │ Esc Cancelar │ Tab Cambiar Foco '
      : ' Tab para activar navegación por flechas ';
    const bottomBarLen = Math.max(0, contentWidth - helper.length);
    lines.push(
      Chalk.hex(borderColor, `${b.bottomLeft}${b.horizontal}${Chalk.dim(helper)}${b.horizontal.repeat(bottomBarLen)}${b.bottomRight}`)
    );

    return lines;
  }
}
