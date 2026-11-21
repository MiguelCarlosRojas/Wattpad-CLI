import { ViewInterface, KeyPressEvent } from '../../../shared/types/navigation.types';
import { LibraryItem } from '../../../shared/types/library.types';
import { LibraryService } from '../library-service';
import { HeaderComponent } from '../../../platform/terminal/components/header';
import { FooterComponent } from '../../../platform/terminal/components/footer';
import { SessionManager } from '../../../auth/session/session-manager';
import { COLORS } from '../../../shared/constants/colors.constants';
import { formatDate } from '../../../shared/utils/string-utils';

export class LibraryView implements ViewInterface {
  public id = 'library' as const;
  private items: LibraryItem[] = [];
  private selectedIndex = 0;
  private filterQuery = '';
  private filterSort: 'recent' | 'alpha' = 'recent';
  private isSearching = false;
  private statusMessage = '';

  private onBack: () => void;

  constructor(onBack: () => void) {
    this.onBack = onBack;
  }

  public async init(): Promise<void> {
    this.items = await LibraryService.getLibrary();
    this.selectedIndex = 0;
  }

  private getFilteredItems(): LibraryItem[] {
    let list = this.items;
    if (this.filterQuery.trim()) {
      const q = this.filterQuery.toLowerCase();
      list = list.filter((i) => i.title.toLowerCase().includes(q) || i.authorUsername.toLowerCase().includes(q));
    }
    if (this.filterSort === 'alpha') {
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const user = SessionManager.getUsername();

    lines.push(...HeaderComponent.render({ width, connectedUser: user }));
    lines.push(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Biblioteca personal de Wattpad${COLORS.RESET}`);
    lines.push('');

    // Búsqueda en biblioteca
    const searchBorder = this.isSearching ? COLORS.ORANGE : COLORS.BORDER;
    lines.push(`  ${COLORS.TEXT_MUTED}Buscar en mi biblioteca:${COLORS.RESET} ${searchBorder}${this.filterQuery}${this.isSearching ? '_' : ''}${COLORS.RESET}  ${COLORS.TEXT_DIM}(Orden: ${this.filterSort === 'recent' ? 'Recientes' : 'Alfabético'})${COLORS.RESET}`);
    lines.push('');

    if (this.statusMessage) {
      lines.push(`  ${this.statusMessage}`);
      lines.push('');
    }

    const filtered = this.getFilteredItems();
    if (filtered.length === 0) {
      lines.push(`  ${COLORS.TEXT_MUTED}No hay historias guardadas en tu biblioteca.${COLORS.RESET}`);
      lines.push(`  ${COLORS.TEXT_DIM}Usa "Buscar novelas" para descubrir historias y agregarlas a tu biblioteca.${COLORS.RESET}`);
      lines.push('');
    } else {
      filtered.forEach((item, idx) => {
        const isSelected = idx === this.selectedIndex && !this.isSearching;
        const pointer = isSelected ? `${COLORS.ORANGE}❯${COLORS.RESET} ` : '  ';
        const titleColor = isSelected ? `${COLORS.BOLD}${COLORS.ORANGE}` : COLORS.TEXT_MAIN;

        lines.push(`  ${pointer}${titleColor}${item.title}${COLORS.RESET}`);
        lines.push(`     ${COLORS.TEXT_MUTED}Autor:${COLORS.RESET} @${item.authorUsername} · ${COLORS.TEXT_MUTED}Género:${COLORS.RESET} ${item.genre} · ${item.chaptersCount} partes`);
        lines.push(`     ${COLORS.TEXT_DIM}Actualizada: ${formatDate(item.lastUpdated)}${COLORS.RESET}`);
        lines.push('');
      });
    }

    const currentLines = lines.length;
    const remaining = Math.max(1, height - currentLines - 4);
    for (let i = 0; i < remaining; i++) {
      lines.push('');
    }

    lines.push(...FooterComponent.render(['↑↓ Navegar', 'Tab Filtros/Buscar', 'D Quitar de biblioteca', 'Esc Volver'], width));
    return lines;
  }

  public handleKey(event: KeyPressEvent): void {
    if (this.isSearching) {
      if (event.key === 'enter' || event.key === 'escape') {
        this.isSearching = false;
      } else if (event.key === 'backspace') {
        this.filterQuery = this.filterQuery.slice(0, -1);
      } else if (event.key.length === 1 && !event.ctrl && !event.alt) {
        this.filterQuery += event.key;
      }
      return;
    }

    if (event.key === 'escape') {
      this.onBack();
      return;
    }

    if (event.key === 'tab') {
      this.filterSort = this.filterSort === 'recent' ? 'alpha' : 'recent';
      this.statusMessage = `${COLORS.INFO}Orden cambiado a: ${this.filterSort === 'recent' ? 'Recientes' : 'Alfabético'}${COLORS.RESET}`;
      return;
    }

    if (event.key === '/' || (event.key === 'f' && event.ctrl)) {
      this.isSearching = true;
      return;
    }

    const filtered = this.getFilteredItems();

    if (event.key === 'up') {
      if (filtered.length > 0) {
        this.selectedIndex = (this.selectedIndex - 1 + filtered.length) % filtered.length;
      }
    } else if (event.key === 'down') {
      if (filtered.length > 0) {
        this.selectedIndex = (this.selectedIndex + 1) % filtered.length;
      }
    } else if (event.key.toLowerCase() === 'd') {
      const item = filtered[this.selectedIndex];
      if (item) {
        LibraryService.removeFromLibrary(item.storyId);
        this.items = this.items.filter((i) => i.storyId !== item.storyId);
        this.statusMessage = `${COLORS.SUCCESS}✓ "${item.title}" eliminada de tu biblioteca.${COLORS.RESET}`;
        if (this.selectedIndex >= this.items.length) {
          this.selectedIndex = Math.max(0, this.items.length - 1);
        }
      }
    }
  }
}
