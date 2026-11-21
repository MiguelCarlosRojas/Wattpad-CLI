import { ViewInterface, KeyPressEvent } from '../../../shared/types/navigation.types';
import { StoryMetadata } from '../../../shared/types/story.types';
import { StoryService } from '../story-service';
import { HeaderComponent } from '../../../platform/terminal/components/header';
import { FooterComponent } from '../../../platform/terminal/components/footer';
import { SessionManager } from '../../../auth/session/session-manager';
import { COLORS } from '../../../shared/constants/colors.constants';
import { formatDate } from '../../../shared/utils/string-utils';

export class MyStoriesView implements ViewInterface {
  public id = 'my-stories' as const;
  private stories: StoryMetadata[] = [];
  private selectedIndex = 0;
  private filterStatus: 'all' | 'published' | 'draft' | 'local' = 'all';

  private onSelectStory: (story: StoryMetadata) => void;
  private onBack: () => void;

  constructor(onSelectStory: (story: StoryMetadata) => void, onBack: () => void) {
    this.onSelectStory = onSelectStory;
    this.onBack = onBack;
  }

  public async init(): Promise<void> {
    this.stories = StoryService.getMyStories();
    this.selectedIndex = 0;
  }

  private getFilteredStories(): StoryMetadata[] {
    if (this.filterStatus === 'published') return this.stories.filter((s) => s.status === 'published');
    if (this.filterStatus === 'draft') return this.stories.filter((s) => s.status === 'draft');
    if (this.filterStatus === 'local') return this.stories.filter((s) => s.status === 'local');
    return this.stories;
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const user = SessionManager.getUsername();

    lines.push(...HeaderComponent.render({ width, connectedUser: user }));
    lines.push(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Mis historias${COLORS.RESET}`);
    lines.push('');

    // Indicador de filtro
    const filterLabel =
      this.filterStatus === 'all'
        ? 'Todas'
        : this.filterStatus === 'published'
        ? 'Publicadas'
        : this.filterStatus === 'draft'
        ? 'Borradores'
        : 'Locales';
    lines.push(`  ${COLORS.TEXT_MUTED}Filtro:${COLORS.RESET} ${COLORS.ORANGE}${filterLabel}${COLORS.RESET}  ${COLORS.TEXT_DIM}(Presiona Tab para alternar)${COLORS.RESET}`);
    lines.push('');

    const filtered = this.getFilteredStories();

    if (filtered.length === 0) {
      lines.push(`  ${COLORS.TEXT_MUTED}No tienes historias registradas en esta categoría.${COLORS.RESET}`);
      lines.push(`  ${COLORS.TEXT_DIM}Usa la opción 4 ("Crear historia") en el menú principal para iniciar tu primer proyecto.${COLORS.RESET}`);
      lines.push('');
    } else {
      filtered.forEach((story, idx) => {
        const isSelected = idx === this.selectedIndex;
        const pointer = isSelected ? `${COLORS.ORANGE}❯${COLORS.RESET} ` : '  ';
        const titleStyle = isSelected ? `${COLORS.BOLD}${COLORS.ORANGE}` : COLORS.TEXT_MAIN;

        let statusBadge = `${COLORS.SUCCESS}Publicada${COLORS.RESET}`;
        if (story.status === 'draft') statusBadge = `${COLORS.WARNING}Borrador${COLORS.RESET}`;
        else if (story.status === 'local') statusBadge = `${COLORS.INFO}Local${COLORS.RESET}`;
        else if (story.status === 'modified') statusBadge = `${COLORS.ORANGE}Modificada${COLORS.RESET}`;

        lines.push(`  ${pointer}${titleStyle}${story.title}${COLORS.RESET}`);
        lines.push(`      ${COLORS.TEXT_MUTED}${story.totalChapters} capítulos · ${statusBadge}${COLORS.RESET} · ${COLORS.TEXT_DIM}Actualizada: ${formatDate(story.updatedAt)}${COLORS.RESET}`);
        lines.push('');
      });
    }

    const currentLines = lines.length;
    const remaining = Math.max(1, height - currentLines - 4);
    for (let i = 0; i < remaining; i++) {
      lines.push('');
    }

    lines.push(...FooterComponent.render(['↑↓ Navegar', 'Enter Administrar', 'Tab Filtro', 'Esc Volver'], width));
    return lines;
  }

  public handleKey(event: KeyPressEvent): void {
    if (event.key === 'escape') {
      this.onBack();
      return;
    }

    if (event.key === 'tab') {
      const statuses: ('all' | 'published' | 'draft' | 'local')[] = ['all', 'published', 'draft', 'local'];
      const curIdx = statuses.indexOf(this.filterStatus);
      this.filterStatus = statuses[(curIdx + 1) % statuses.length];
      this.selectedIndex = 0;
      return;
    }

    const filtered = this.getFilteredStories();

    if (event.key === 'up') {
      if (filtered.length > 0) {
        this.selectedIndex = (this.selectedIndex - 1 + filtered.length) % filtered.length;
      }
    } else if (event.key === 'down') {
      if (filtered.length > 0) {
        this.selectedIndex = (this.selectedIndex + 1) % filtered.length;
      }
    } else if (event.key === 'enter') {
      const selected = filtered[this.selectedIndex];
      if (selected) {
        this.onSelectStory(selected);
      }
    }
  }
}
