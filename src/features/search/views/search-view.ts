import { ViewInterface, KeyPressEvent } from '../../../shared/types/navigation.types';
import { SearchResultItem } from '../../../shared/types/search.types';
import { SearchService } from '../search-service';
import { SearchFiltersPanel } from '../components/search-filters';
import { HeaderComponent } from '../../../platform/terminal/components/header';
import { FooterComponent } from '../../../platform/terminal/components/footer';
import { SessionManager } from '../../../auth/session/session-manager';
import { COLORS } from '../../../shared/constants/colors.constants';
import { truncate } from '../../../shared/utils/ansi';
import { formatNumber } from '../../../shared/utils/string-utils';

export class SearchView implements ViewInterface {
  public id = 'search' as const;
  private query = 'fantasía';
  private results: SearchResultItem[] = [];
  private selectedIndex = 0;
  private isLoading = false;
  private showFilters = false;
  private filtersPanel = new SearchFiltersPanel();
  private focusMode: 'input' | 'results' | 'filters' = 'results';

  private onSelectStory: (story: SearchResultItem) => void;
  private onBack: () => void;

  constructor(onSelectStory: (story: SearchResultItem) => void, onBack: () => void) {
    this.onSelectStory = onSelectStory;
    this.onBack = onBack;
  }

  public async init(): Promise<void> {
    await this.performSearch();
  }

  private async performSearch(): Promise<void> {
    if (!this.query.trim()) return;
    this.isLoading = true;
    const filters = this.filtersPanel.getFilters(this.query);
    this.results = await SearchService.search(filters);
    this.selectedIndex = 0;
    this.isLoading = false;
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const user = SessionManager.getUsername();

    lines.push(...HeaderComponent.render({ width, connectedUser: user }));
    lines.push(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Buscar novelas en Wattpad${COLORS.RESET}`);
    lines.push('');

    // Barra de búsqueda interactiva
    const inputBorder = this.focusMode === 'input' ? COLORS.ORANGE : COLORS.BORDER;
    lines.push(`  ${COLORS.TEXT_MUTED}Buscar:${COLORS.RESET} ${inputBorder}╭──────────────────────────────────────────────╮${COLORS.RESET}`);
    lines.push(`          ${inputBorder}│${COLORS.RESET} ${COLORS.TEXT_MAIN}${this.query}${this.focusMode === 'input' ? '_' : ' '}${' '.repeat(Math.max(0, 44 - this.query.length))}${inputBorder}│${COLORS.RESET}`);
    lines.push(`          ${inputBorder}╰──────────────────────────────────────────────╯${COLORS.RESET}`);
    lines.push('');

    // Panel de filtros (si está visible)
    if (this.showFilters) {
      lines.push(...this.filtersPanel.render(width));
    }

    if (this.isLoading) {
      lines.push(`  ${COLORS.ORANGE}⏳ Buscando en Wattpad...${COLORS.RESET}`);
      lines.push('');
    } else if (this.results.length === 0) {
      lines.push(`  ${COLORS.TEXT_MUTED}No se encontraron resultados para "${this.query}". Presiona Tab para ajustar filtros o escribe otro término.${COLORS.RESET}`);
      lines.push('');
    } else {
      lines.push(`  ${COLORS.BOLD}${COLORS.TEXT_MUTED}Resultados (${this.results.length}):${COLORS.RESET}`);
      lines.push('');

      // Mostrar hasta 6 resultados a la vez
      const pageSize = 5;
      const startIdx = Math.max(0, Math.min(this.selectedIndex - 2, this.results.length - pageSize));
      const visibleItems = this.results.slice(startIdx, startIdx + pageSize);

      visibleItems.forEach((item, idx) => {
        const actualIdx = startIdx + idx;
        const isSelected = actualIdx === this.selectedIndex && this.focusMode === 'results';
        const pointer = isSelected ? `${COLORS.ORANGE}❯${COLORS.RESET} ` : '  ';
        const titleStyle = isSelected ? `${COLORS.BOLD}${COLORS.ORANGE}` : COLORS.TEXT_MAIN;

        lines.push(`  ${pointer}${titleStyle}${item.title}${COLORS.RESET}`);
        lines.push(`      ${COLORS.TEXT_MUTED}Autor:${COLORS.RESET} ${item.authorName} (@${item.authorUsername})   ${COLORS.TEXT_MUTED}Género:${COLORS.RESET} ${item.genre} · ${item.statusLabel}`);
        lines.push(`      ${COLORS.TEXT_DIM}Lecturas: ${formatNumber(item.reads)} · Votos: ${formatNumber(item.votes)} · Partes: ${item.chaptersCount}${COLORS.RESET}`);
        lines.push(`      ${COLORS.TEXT_DIM}${truncate(item.description, width - 10)}${COLORS.RESET}`);
        lines.push('');
      });
    }

    const currentLines = lines.length;
    const remaining = Math.max(1, height - currentLines - 4);
    for (let i = 0; i < remaining; i++) {
      lines.push('');
    }

    lines.push(...FooterComponent.render(['↑↓ Navegar', 'Enter Ver novela', 'Tab Filtros/Buscar', 'Esc Volver'], width));
    return lines;
  }

  public async handleKey(event: KeyPressEvent): Promise<void> {
    if (event.key === 'escape') {
      if (this.showFilters) {
        this.showFilters = false;
        this.focusMode = 'results';
      } else {
        this.onBack();
      }
      return;
    }

    if (event.key === 'tab') {
      if (this.focusMode === 'results') {
        this.focusMode = 'input';
      } else if (this.focusMode === 'input') {
        this.showFilters = true;
        this.focusMode = 'filters';
      } else {
        this.showFilters = false;
        this.focusMode = 'results';
      }
      return;
    }

    if (this.focusMode === 'filters') {
      const handled = this.filtersPanel.handleKey(event.key);
      if (handled) {
        await this.performSearch();
      }
      return;
    }

    if (this.focusMode === 'input') {
      if (event.key === 'enter') {
        await this.performSearch();
        this.focusMode = 'results';
      } else if (event.key === 'backspace') {
        this.query = this.query.slice(0, -1);
      } else if (event.key.length === 1 && !event.ctrl && !event.alt) {
        this.query += event.key;
      }
      return;
    }

    if (this.focusMode === 'results') {
      if (event.key === 'up') {
        if (this.results.length > 0) {
          this.selectedIndex = (this.selectedIndex - 1 + this.results.length) % this.results.length;
        }
      } else if (event.key === 'down') {
        if (this.results.length > 0) {
          this.selectedIndex = (this.selectedIndex + 1) % this.results.length;
        }
      } else if (event.key === 'enter') {
        const item = this.results[this.selectedIndex];
        if (item) {
          this.onSelectStory(item);
        }
      }
    }
  }
}
