import { ViewInterface, KeyPressEvent } from '../../../shared/types/navigation.types';
import { ChapterMetadata } from '../../../shared/types/chapter.types';
import { ChapterService } from '../chapter-service';
import { HeaderComponent } from '../../../platform/terminal/components/header';
import { FooterComponent } from '../../../platform/terminal/components/footer';
import { SessionManager } from '../../../auth/session/session-manager';
import { COLORS } from '../../../shared/constants/colors.constants';
import { countWords } from '../../../shared/utils/string-utils';
import { divider } from '../../../shared/utils/ansi';
import { env } from '../../../shared/config/env.config';

export class ChapterEditor implements ViewInterface {
  public id = 'chapter-editor' as const;
  private storyTitle: string;
  private chapter: ChapterMetadata;
  private lines: string[] = [''];
  private cursorRow = 0;
  private cursorCol = 0;
  private isPreview = false;
  private isSaved = true;
  private autoSaveTimer: any = null;

  private onExit: () => void;

  constructor(storyTitle: string, chapter: ChapterMetadata, initialContent: string, onExit: () => void) {
    this.storyTitle = storyTitle;
    this.chapter = chapter;
    this.onExit = onExit;

    if (initialContent) {
      this.lines = initialContent.split('\n');
    }
    if (this.lines.length === 0) {
      this.lines = [''];
    }

    // Iniciar temporizador de guardado automático
    const autosaveMs = (env.WATTPAD_AUTOSAVE_INTERVAL || 20) * 1000;
    this.autoSaveTimer = setInterval(() => {
      if (!this.isSaved) {
        this.saveCurrent();
      }
    }, autosaveMs);
    if (this.autoSaveTimer?.unref) {
      this.autoSaveTimer.unref();
    }
  }

  private saveCurrent(): void {
    const content = this.lines.join('\n');
    ChapterService.saveChapter(this.storyTitle, this.chapter, content);
    this.isSaved = true;
  }

  public render(width: number, height: number): string[] {
    const screenLines: string[] = [];
    const user = SessionManager.getUsername();

    screenLines.push(...HeaderComponent.render({ width, connectedUser: user }));

    const fullContent = this.lines.join('\n');
    const words = countWords(fullContent);
    const chars = fullContent.length;
    const saveStatus = this.isSaved ? `${COLORS.SUCCESS}● Guardado${COLORS.RESET}` : `${COLORS.WARNING}○ Sin guardar${COLORS.RESET}`;

    screenLines.push(
      `  ${COLORS.BOLD}${COLORS.ORANGE}Editor de Capítulos${COLORS.RESET} · ${COLORS.TEXT_MAIN}${this.storyTitle}${COLORS.RESET} / ${COLORS.BOLD}${this.chapter.title}${COLORS.RESET}`
    );
    screenLines.push(
      `  ${COLORS.TEXT_MUTED}Palabras:${COLORS.RESET} ${words}  ·  ${COLORS.TEXT_MUTED}Caracteres:${COLORS.RESET} ${chars}  ·  ${saveStatus}`
    );
    screenLines.push('');
    screenLines.push(divider(width));

    if (this.isPreview) {
      screenLines.push(`  ${COLORS.BOLD}${COLORS.INFO}[ Vista Previa del Capítulo ]${COLORS.RESET}`);
      screenLines.push('');
      this.lines.forEach((l) => {
        screenLines.push(`    ${COLORS.TEXT_MAIN}${l}${COLORS.RESET}`);
      });
    } else {
      // Área de edición
      const editorHeight = Math.max(8, height - 14);
      const startRow = Math.max(0, this.cursorRow - Math.floor(editorHeight / 2));
      const endRow = Math.min(this.lines.length, startRow + editorHeight);

      for (let r = startRow; r < endRow; r++) {
        const lineText = this.lines[r] || '';
        const lineNum = String(r + 1).padStart(3, ' ');
        const isCurrentLine = r === this.cursorRow;
        const linePrefix = isCurrentLine ? `${COLORS.ORANGE}${lineNum} │ ${COLORS.RESET}` : `${COLORS.TEXT_DIM}${lineNum} │ ${COLORS.RESET}`;

        if (isCurrentLine) {
          // Renderizar cursor visible dentro de la línea
          const before = lineText.slice(0, this.cursorCol);
          const cursorChar = lineText.slice(this.cursorCol, this.cursorCol + 1) || ' ';
          const after = lineText.slice(this.cursorCol + 1);
          screenLines.push(`  ${linePrefix}${before}${COLORS.INVERSE}${cursorChar}${COLORS.RESET}${after}`);
        } else {
          screenLines.push(`  ${linePrefix}${lineText}`);
        }
      }
    }

    const currentLength = screenLines.length;
    const remaining = Math.max(1, height - currentLength - 4);
    for (let i = 0; i < remaining; i++) {
      screenLines.push('');
    }

    screenLines.push(
      ...FooterComponent.render(
        ['↑↓←→ Mover cursor', 'Ctrl+S Guardar', 'Ctrl+P Previsualizar', 'Esc Guardar y Salir'],
        width
      )
    );

    return screenLines;
  }

  public handleKey(event: KeyPressEvent): void {
    // Escape: Guardar y salir
    if (event.key === 'escape') {
      this.saveCurrent();
      if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
      this.onExit();
      return;
    }

    // Ctrl+S: Guardar manual
    if (event.ctrl && event.key.toLowerCase() === 's') {
      this.saveCurrent();
      return;
    }

    // Ctrl+P: Alternar previsualización
    if (event.ctrl && event.key.toLowerCase() === 'p') {
      this.isPreview = !this.isPreview;
      return;
    }

    if (this.isPreview) {
      this.isPreview = false;
      return;
    }

    // Flechas de navegación del cursor
    if (event.key === 'up') {
      if (this.cursorRow > 0) {
        this.cursorRow--;
        this.cursorCol = Math.min(this.cursorCol, this.lines[this.cursorRow].length);
      }
      return;
    }
    if (event.key === 'down') {
      if (this.cursorRow < this.lines.length - 1) {
        this.cursorRow++;
        this.cursorCol = Math.min(this.cursorCol, this.lines[this.cursorRow].length);
      }
      return;
    }
    if (event.key === 'left') {
      if (this.cursorCol > 0) {
        this.cursorCol--;
      } else if (this.cursorRow > 0) {
        this.cursorRow--;
        this.cursorCol = this.lines[this.cursorRow].length;
      }
      return;
    }
    if (event.key === 'right') {
      if (this.cursorCol < this.lines[this.cursorRow].length) {
        this.cursorCol++;
      } else if (this.cursorRow < this.lines.length - 1) {
        this.cursorRow++;
        this.cursorCol = 0;
      }
      return;
    }

    // Enter: nueva línea
    if (event.key === 'enter') {
      const curLine = this.lines[this.cursorRow];
      const before = curLine.slice(0, this.cursorCol);
      const after = curLine.slice(this.cursorCol);
      this.lines[this.cursorRow] = before;
      this.lines.splice(this.cursorRow + 1, 0, after);
      this.cursorRow++;
      this.cursorCol = 0;
      this.isSaved = false;
      return;
    }

    // Backspace: borrar
    if (event.key === 'backspace') {
      const curLine = this.lines[this.cursorRow];
      if (this.cursorCol > 0) {
        this.lines[this.cursorRow] = curLine.slice(0, this.cursorCol - 1) + curLine.slice(this.cursorCol);
        this.cursorCol--;
        this.isSaved = false;
      } else if (this.cursorRow > 0) {
        const prevLine = this.lines[this.cursorRow - 1];
        const newCol = prevLine.length;
        this.lines[this.cursorRow - 1] = prevLine + curLine;
        this.lines.splice(this.cursorRow, 1);
        this.cursorRow--;
        this.cursorCol = newCol;
        this.isSaved = false;
      }
      return;
    }

    // Caracteres imprimibles
    if (event.key.length === 1 && !event.ctrl && !event.alt) {
      const curLine = this.lines[this.cursorRow];
      this.lines[this.cursorRow] = curLine.slice(0, this.cursorCol) + event.key + curLine.slice(this.cursorCol);
      this.cursorCol++;
      this.isSaved = false;
    }
  }
}
