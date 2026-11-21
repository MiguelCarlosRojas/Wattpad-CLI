import readline from 'readline';
import { InteractiveView } from './interactive-view.interface';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface MenuItem {
  id: string;
  label: string;
  category?: string;
  description?: string;
  badge?: string;
  badgeColor?: string;
  details?: string[];
  action?: () => Promise<void> | void;
}

export interface MenuViewProps {
  id: string;
  title: string;
  subtitle?: string;
  items: MenuItem[];
  categories?: string[];
  onSelect?: (item: MenuItem) => Promise<void> | void;
}

export class InteractiveMenuView implements InteractiveView {
  private selectedIndex: number = 0;
  private selectedCategoryIndex: number = 0;
  private detailMode: boolean = false;

  constructor(private props: MenuViewProps) {}

  public getId(): string {
    return this.props.id;
  }

  public getTitle(): string {
    return this.props.title;
  }

  public getBreadcrumbs(): string[] {
    return ['Wattpad CLI', this.props.title];
  }

  public getStatusBarHint(): string {
    if (this.detailMode) {
      return 'Esc Volver al listado  ·  Enter Ejecutar acción';
    }
    const catHint = this.props.categories && this.props.categories.length > 1 ? '  ·  ←/→ Cambiar categoría' : '';
    return `↑/↓ Seleccionar${catHint}  ·  Enter Confirmar/Detalles  ·  Esc Salir`;
  }

  private getFilteredItems(): MenuItem[] {
    if (!this.props.categories || this.props.categories.length === 0) {
      return this.props.items;
    }
    const curCat = this.props.categories[this.selectedCategoryIndex];
    if (!curCat || curCat === 'Todos') return this.props.items;
    return this.props.items.filter((it) => it.category === curCat);
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const w = Math.max(50, width);
    const innerW = w - 4;
    const items = this.getFilteredItems();

    if (this.selectedIndex >= items.length) {
      this.selectedIndex = Math.max(0, items.length - 1);
    }

    // Cabecera
    const topBar =
      Chalk.hex(Theme.colors.surfaceBorder, '╭─ ') +
      Chalk.bold(Chalk.hex(Theme.colors.primary, this.props.title)) +
      Chalk.hex(Theme.colors.surfaceBorder, ` ${'─'.repeat(Math.max(2, w - this.props.title.length - 6))}╮`);
    lines.push(topBar);

    if (this.props.subtitle) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim(this.props.subtitle), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    }

    // Pestañas de categorías si existen
    if (this.props.categories && this.props.categories.length > 1) {
      const tabsStr = this.props.categories
        .map((cat, idx) => {
          if (idx === this.selectedCategoryIndex) {
            return Chalk.bold(Chalk.hex(Theme.colors.primary, `[ ${cat} ]`));
          }
          return Chalk.dim(`  ${cat}  `);
        })
        .join(' ');
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(tabsStr, innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(Chalk.hex(Theme.colors.surfaceBorder, `├${'─'.repeat(w - 2)}┤`));
    }

    // Modo Detalle Completo
    if (this.detailMode && items[this.selectedIndex]) {
      const item = items[this.selectedIndex];
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.primary, `DETALLES: ${item.label}`)), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      if (item.description) {
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.hex(Theme.colors.textSecondary, item.description), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      }
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible('', innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );

      if (item.details) {
        item.details.forEach((dt) => {
          lines.push(
            Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
            padEndVisible(`  • ${dt}`, innerW) +
            Chalk.hex(Theme.colors.surfaceBorder, ' │')
          );
        });
      }

      while (lines.length < height - 2) {
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible('', innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      }
      lines.push(Chalk.hex(Theme.colors.surfaceBorder, `╰${'─'.repeat(w - 2)}╯`));
      return lines;
    }

    // Lista interactiva de opciones
    const capacity = Math.max(4, height - 7);
    let startIdx = 0;
    if (this.selectedIndex >= capacity) {
      startIdx = this.selectedIndex - capacity + 1;
    }
    const visibleItems = items.slice(startIdx, startIdx + capacity);

    if (items.length === 0) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim('  No hay elementos disponibles en esta sección.'), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    } else {
      visibleItems.forEach((it, relIdx) => {
        const absIdx = startIdx + relIdx;
        const isSelected = absIdx === this.selectedIndex;
        const marker = isSelected ? Chalk.bold(Chalk.hex(Theme.colors.primary, ' › ')) : '   ';
        const labelText = isSelected
          ? Chalk.bold(Chalk.hex(Theme.colors.primary, it.label))
          : Chalk.hex(Theme.colors.text, it.label);
        const badgeText = it.badge
          ? Chalk.hex(it.badgeColor || Theme.colors.info, `[${it.badge}] `)
          : '';
        const descText = it.description ? Chalk.dim(` — ${it.description}`) : '';

        const lineStr = `${marker}${badgeText}${labelText}${descText}`;
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(lineStr, innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      });
    }

    while (lines.length < capacity + (this.props.categories ? 4 : 2)) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible('', innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    }

    // Panel de descripción inferior
    lines.push(Chalk.hex(Theme.colors.surfaceBorder, `├${'─'.repeat(w - 2)}┤`));
    const selectedItem = items[this.selectedIndex];
    if (selectedItem) {
      const desc = selectedItem.description || selectedItem.label;
      const hint = 'Enter: Seleccionar / Abrir detalles   Esc: Volver';
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.hex(Theme.colors.textSecondary, `▸ ${desc}`), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim(hint), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    } else {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim('Selecciona un elemento de la lista.'), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible('', innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    }

    lines.push(Chalk.hex(Theme.colors.surfaceBorder, `╰${'─'.repeat(w - 2)}╯`));
    return lines;
  }

  public handleKeyPress(str: string, key: readline.Key): boolean | 'pop' {
    const items = this.getFilteredItems();

    if (key.name === 'escape') {
      if (this.detailMode) {
        this.detailMode = false;
        return true;
      }
      return 'pop';
    }

    if (key.name === 'up') {
      if (this.selectedIndex > 0) {
        this.selectedIndex--;
      }
      return true;
    }

    if (key.name === 'down') {
      if (this.selectedIndex < items.length - 1) {
        this.selectedIndex++;
      }
      return true;
    }

    if (this.props.categories && this.props.categories.length > 1) {
      if (key.name === 'left') {
        this.selectedCategoryIndex =
          (this.selectedCategoryIndex - 1 + this.props.categories.length) % this.props.categories.length;
        this.selectedIndex = 0;
        return true;
      }
      if (key.name === 'right') {
        this.selectedCategoryIndex = (this.selectedCategoryIndex + 1) % this.props.categories.length;
        this.selectedIndex = 0;
        return true;
      }
    }

    if (key.name === 'return') {
      const selectedItem = items[this.selectedIndex];
      if (selectedItem) {
        if (selectedItem.details && selectedItem.details.length > 0 && !this.detailMode) {
          this.detailMode = true;
          return true;
        }
        if (selectedItem.action) {
          selectedItem.action();
          return 'pop';
        }
        if (this.props.onSelect) {
          this.props.onSelect(selectedItem);
          return 'pop';
        }
      }
    }

    return true;
  }
}
