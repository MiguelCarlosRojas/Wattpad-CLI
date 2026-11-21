import { SearchFilters } from '../../../shared/types/search.types';
import { COLORS } from '../../../shared/constants/colors.constants';

export class SearchFiltersPanel {
  public static GENRES = ['Todos', 'Romance', 'Fantasía', 'Ciencia ficción', 'Misterio', 'Terror', 'Aventura', 'Drama', 'Acción', 'Juvenil'];
  public static STATUSES = ['Todos', 'En curso', 'Completada'];
  public static LANGUAGES = ['Todos', 'Español', 'Inglés'];
  public static SORTS = ['Relevancia', 'Popularidad', 'Recientes'];

  private selectedRow = 0; // 0: Genero, 1: Estado, 2: Idioma, 3: Orden, 4: Adultos
  private genreIdx = 0;
  private statusIdx = 0;
  private langIdx = 0;
  private sortIdx = 0;
  private mature = false;

  public getFilters(query: string): SearchFilters {
    return {
      query,
      genre: SearchFiltersPanel.GENRES[this.genreIdx],
      status: this.statusIdx === 1 ? 'ongoing' : this.statusIdx === 2 ? 'completed' : 'all',
      language: this.langIdx === 1 ? 'es' : this.langIdx === 2 ? 'en' : 'all',
      sort: this.sortIdx === 1 ? 'popular' : this.sortIdx === 2 ? 'recent' : 'relevance',
      mature: this.mature,
    };
  }

  public handleKey(key: string): boolean {
    if (key === 'up') {
      this.selectedRow = (this.selectedRow - 1 + 5) % 5;
      return true;
    }
    if (key === 'down') {
      this.selectedRow = (this.selectedRow + 1) % 5;
      return true;
    }
    if (key === 'left') {
      if (this.selectedRow === 0) this.genreIdx = (this.genreIdx - 1 + SearchFiltersPanel.GENRES.length) % SearchFiltersPanel.GENRES.length;
      if (this.selectedRow === 1) this.statusIdx = (this.statusIdx - 1 + SearchFiltersPanel.STATUSES.length) % SearchFiltersPanel.STATUSES.length;
      if (this.selectedRow === 2) this.langIdx = (this.langIdx - 1 + SearchFiltersPanel.LANGUAGES.length) % SearchFiltersPanel.LANGUAGES.length;
      if (this.selectedRow === 3) this.sortIdx = (this.sortIdx - 1 + SearchFiltersPanel.SORTS.length) % SearchFiltersPanel.SORTS.length;
      if (this.selectedRow === 4) this.mature = !this.mature;
      return true;
    }
    if (key === 'right') {
      if (this.selectedRow === 0) this.genreIdx = (this.genreIdx + 1) % SearchFiltersPanel.GENRES.length;
      if (this.selectedRow === 1) this.statusIdx = (this.statusIdx + 1) % SearchFiltersPanel.STATUSES.length;
      if (this.selectedRow === 2) this.langIdx = (this.langIdx + 1) % SearchFiltersPanel.LANGUAGES.length;
      if (this.selectedRow === 3) this.sortIdx = (this.sortIdx + 1) % SearchFiltersPanel.SORTS.length;
      if (this.selectedRow === 4) this.mature = !this.mature;
      return true;
    }
    return false;
  }

  public render(width: number): string[] {
    const lines: string[] = [];
    lines.push(`  ${COLORS.BOLD}${COLORS.ORANGE}Filtros de Búsqueda${COLORS.RESET} ${COLORS.TEXT_DIM}(Usa ↑↓ para fila, ←→ para cambiar)${COLORS.RESET}`);

    const rows = [
      { label: 'Género', val: SearchFiltersPanel.GENRES[this.genreIdx] },
      { label: 'Estado', val: SearchFiltersPanel.STATUSES[this.statusIdx] },
      { label: 'Idioma', val: SearchFiltersPanel.LANGUAGES[this.langIdx] },
      { label: 'Orden', val: SearchFiltersPanel.SORTS[this.sortIdx] },
      { label: 'Contenido adulto', val: this.mature ? 'Sí (+18)' : 'No (Todos)' },
    ];

    rows.forEach((r, idx) => {
      const isSelected = idx === this.selectedRow;
      const cursor = isSelected ? `${COLORS.ORANGE}❯${COLORS.RESET} ` : '  ';
      const labelColor = isSelected ? `${COLORS.BOLD}${COLORS.TEXT_MAIN}` : COLORS.TEXT_MUTED;
      const valColor = isSelected ? `${COLORS.ORANGE}◄ ${r.val} ►${COLORS.RESET}` : `${COLORS.TEXT_MAIN}${r.val}${COLORS.RESET}`;

      lines.push(`    ${cursor}${labelColor}${r.label.padEnd(20)}${COLORS.RESET}: ${valColor}`);
    });

    lines.push('');
    return lines;
  }
}
