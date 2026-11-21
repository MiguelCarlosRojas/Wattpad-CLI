import { ViewInterface, KeyPressEvent } from '../../../shared/types/navigation.types';
import { ChapterMetadata } from '../../../shared/types/chapter.types';
import { StoryMetadata } from '../../../shared/types/story.types';
import { ChapterService } from '../chapter-service';
import { HeaderComponent } from '../../../platform/terminal/components/header';
import { FooterComponent } from '../../../platform/terminal/components/footer';
import { SessionManager } from '../../../auth/session/session-manager';
import { COLORS } from '../../../shared/constants/colors.constants';
import { formatDate } from '../../../shared/utils/string-utils';

export class ChapterListView implements ViewInterface {
  public id = 'chapters' as const;
  private story: StoryMetadata;
  private chapters: ChapterMetadata[] = [];
  private selectedIndex = 0;
  private statusMessage = '';

  private onEditChapter: (story: StoryMetadata, chapter: ChapterMetadata) => void;
  private onNewChapter: (story: StoryMetadata) => void;
  private onBack: () => void;

  constructor(
    story: StoryMetadata,
    onEditChapter: (story: StoryMetadata, chapter: ChapterMetadata) => void,
    onNewChapter: (story: StoryMetadata) => void,
    onBack: () => void
  ) {
    this.story = story;
    this.onEditChapter = onEditChapter;
    this.onNewChapter = onNewChapter;
    this.onBack = onBack;
  }

  public async init(): Promise<void> {
    this.chapters = ChapterService.getChapters(this.story.title || this.story.id);
    this.selectedIndex = 0;
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const user = SessionManager.getUsername();

    lines.push(...HeaderComponent.render({ width, connectedUser: user }));
    lines.push(`  ${COLORS.BOLD}${COLORS.ORANGE}Capítulos de:${COLORS.RESET} ${COLORS.TEXT_MAIN}${this.story.title}${COLORS.RESET} (${this.chapters.length} partes)`);
    lines.push('');

    if (this.statusMessage) {
      lines.push(`  ${this.statusMessage}`);
      lines.push('');
    }

    if (this.chapters.length === 0) {
      lines.push(`  ${COLORS.TEXT_MUTED}Esta novela aún no tiene capítulos escritos.${COLORS.RESET}`);
      lines.push(`  ${COLORS.TEXT_DIM}Presiona "N" o Enter para redactar tu primer capítulo.${COLORS.RESET}`);
      lines.push('');
    } else {
      this.chapters.forEach((ch, idx) => {
        const isSelected = idx === this.selectedIndex;
        const pointer = isSelected ? `${COLORS.ORANGE}❯${COLORS.RESET} ` : '  ';
        const titleStyle = isSelected ? `${COLORS.BOLD}${COLORS.ORANGE}` : COLORS.TEXT_MAIN;

        let statusBadge = `${COLORS.WARNING}Borrador${COLORS.RESET}`;
        if (ch.status === 'published') statusBadge = `${COLORS.SUCCESS}Publicado${COLORS.RESET}`;
        else if (ch.status === 'modified') statusBadge = `${COLORS.ORANGE}Modificado${COLORS.RESET}`;

        const paddedNum = String(ch.number).padStart(2, '0');
        lines.push(`  ${pointer}${titleStyle}Capítulo ${paddedNum}: ${ch.title}${COLORS.RESET}   ${statusBadge}`);
        lines.push(`      ${COLORS.TEXT_MUTED}${ch.wordsCount} palabras · ${ch.charsCount} caracteres · ${COLORS.TEXT_DIM}Modificado: ${formatDate(ch.updatedAt)}${COLORS.RESET}`);
        lines.push('');
      });
    }

    const currentLines = lines.length;
    const remaining = Math.max(1, height - currentLines - 4);
    for (let i = 0; i < remaining; i++) {
      lines.push('');
    }

    lines.push(...FooterComponent.render(['↑↓ Navegar', 'Enter Abrir y Editar', 'N Nuevo capítulo', 'Esc Volver'], width));
    return lines;
  }

  public handleKey(event: KeyPressEvent): void {
    if (event.key === 'escape') {
      this.onBack();
      return;
    }

    if (event.key.toLowerCase() === 'n') {
      this.onNewChapter(this.story);
      return;
    }

    if (event.key === 'up') {
      if (this.chapters.length > 0) {
        this.selectedIndex = (this.selectedIndex - 1 + this.chapters.length) % this.chapters.length;
      }
    } else if (event.key === 'down') {
      if (this.chapters.length > 0) {
        this.selectedIndex = (this.selectedIndex + 1) % this.chapters.length;
      }
    } else if (event.key === 'enter') {
      if (this.chapters.length > 0 && this.chapters[this.selectedIndex]) {
        this.onEditChapter(this.story, this.chapters[this.selectedIndex]);
      } else {
        this.onNewChapter(this.story);
      }
    }
  }
}
