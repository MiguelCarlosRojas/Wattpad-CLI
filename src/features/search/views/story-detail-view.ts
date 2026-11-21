import { ViewInterface, KeyPressEvent, MenuItem } from '../../../shared/types/navigation.types';
import { SearchResultItem } from '../../../shared/types/search.types';
import { HeaderComponent } from '../../../platform/terminal/components/header';
import { FooterComponent } from '../../../platform/terminal/components/footer';
import { MenuListComponent } from '../../../platform/terminal/components/menu-list';
import { SessionManager } from '../../../auth/session/session-manager';
import { LocalStore } from '../../../infrastructure/persistence/local-store';
import { COLORS } from '../../../shared/constants/colors.constants';
import { formatNumber, formatDate } from '../../../shared/utils/string-utils';

export class StoryDetailView implements ViewInterface {
  public id = 'story-detail' as const;
  private story: SearchResultItem;
  private selectedIndex = 0;
  private statusMessage = '';

  private onBack: () => void;

  private items: MenuItem[] = [
    { id: 'add-library', label: 'Agregar a mi biblioteca', subtitle: 'Guarda esta historia para leer sus capítulos' },
    { id: 'open-url', label: 'Abrir en Wattpad', subtitle: 'Ver la página web oficial de la historia' },
    { id: 'back', label: 'Volver a resultados', subtitle: 'Regresar a la lista de búsqueda' },
  ];

  constructor(story: SearchResultItem, onBack: () => void) {
    this.story = story;
    this.onBack = onBack;
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const user = SessionManager.getUsername();

    lines.push(...HeaderComponent.render({ width, connectedUser: user }));

    lines.push(`  ${COLORS.BOLD}${COLORS.ORANGE}${this.story.title}${COLORS.RESET}`);
    lines.push(`  ${COLORS.TEXT_MUTED}Autor:${COLORS.RESET} ${this.story.authorName} (@${this.story.authorUsername})   ${COLORS.TEXT_MUTED}Estado:${COLORS.RESET} ${this.story.statusLabel}`);
    lines.push(`  ${COLORS.TEXT_MUTED}Género:${COLORS.RESET} ${this.story.genre}   ${COLORS.TEXT_MUTED}Capítulos:${COLORS.RESET} ${this.story.chaptersCount} partes`);
    lines.push(`  ${COLORS.TEXT_DIM}Lecturas: ${formatNumber(this.story.reads)} · Votos: ${formatNumber(this.story.votes)} · Actualizada: ${formatDate(this.story.lastUpdated)}${COLORS.RESET}`);

    if (this.story.tags.length > 0) {
      lines.push(`  ${COLORS.TEXT_DIM}Etiquetas: #${this.story.tags.slice(0, 6).join(' #')}${COLORS.RESET}`);
    }

    lines.push('');
    lines.push(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Sinopsis:${COLORS.RESET}`);

    // Dividir descripción en líneas ajustadas
    const words = this.story.description.split(' ');
    let currentLine = '    ';
    words.forEach((w) => {
      if (currentLine.length + w.length > width - 6) {
        lines.push(`${COLORS.TEXT_MUTED}${currentLine}${COLORS.RESET}`);
        currentLine = '    ' + w + ' ';
      } else {
        currentLine += w + ' ';
      }
    });
    if (currentLine.trim()) {
      lines.push(`${COLORS.TEXT_MUTED}${currentLine}${COLORS.RESET}`);
    }

    lines.push('');
    if (this.statusMessage) {
      lines.push(`  ${this.statusMessage}`);
      lines.push('');
    }

    lines.push(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Acciones:${COLORS.RESET}`);
    const menuLines = MenuListComponent.render(this.items, this.selectedIndex, 4);
    lines.push(...menuLines);

    const currentLines = lines.length;
    const remaining = Math.max(1, height - currentLines - 4);
    for (let i = 0; i < remaining; i++) {
      lines.push('');
    }

    lines.push(...FooterComponent.render(['↑↓ Navegar', 'Enter Seleccionar', 'Esc Volver'], width));
    return lines;
  }

  public handleKey(event: KeyPressEvent): void {
    if (event.key === 'up') {
      this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
    } else if (event.key === 'down') {
      this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    } else if (event.key === 'escape') {
      this.onBack();
    } else if (event.key === 'enter') {
      const selected = this.items[this.selectedIndex];
      if (selected.id === 'add-library') {
        const lib = LocalStore.loadLibrary();
        const exists = lib.some((item) => item.storyId === this.story.id);
        if (!exists) {
          lib.push({
            storyId: this.story.id,
            title: this.story.title,
            authorUsername: this.story.authorUsername,
            authorDisplayName: this.story.authorName,
            description: this.story.description,
            coverUrl: this.story.coverUrl,
            genre: this.story.genre,
            chaptersCount: this.story.chaptersCount,
            lastUpdated: this.story.lastUpdated,
            wattpadUrl: this.story.wattpadUrl,
            addedAt: new Date().toISOString(),
          });
          LocalStore.saveLibrary(lib);
          this.statusMessage = `${COLORS.SUCCESS}✓ Historia agregada a tu biblioteca.${COLORS.RESET}`;
        } else {
          this.statusMessage = `${COLORS.WARNING}Esta historia ya está en tu biblioteca.${COLORS.RESET}`;
        }
      } else if (selected.id === 'open-url') {
        this.statusMessage = `${COLORS.INFO}Enlace oficial: ${this.story.wattpadUrl}${COLORS.RESET}`;
      } else if (selected.id === 'back') {
        this.onBack();
      }
    }
  }
}
