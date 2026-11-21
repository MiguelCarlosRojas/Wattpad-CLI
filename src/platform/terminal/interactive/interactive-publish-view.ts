import readline from 'readline';
import { InteractiveView } from './interactive-view.interface';
import { Story } from '../../../features/stories/types/story.types';
import { Chapter } from '../../../features/chapters/types/chapter.types';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface PublishViewProps {
  stories: Story[];
  chapters: Chapter[];
  onConfirmPublish?: (storyId: string, chapterIds: string[], visibility: string) => Promise<void> | void;
}

export class InteractivePublishView implements InteractiveView {
  private step: 1 | 2 | 3 | 4 | 5 = 1;
  private selectedStoryIndex: number = 0;
  private selectedChapterIndexes: Set<number> = new Set();
  private cursorChapterIndex: number = 0;
  private visibilityOptions = ['Pública (Visible para todos los lectores)', 'Borrador (Privado en Wattpad)'];
  private selectedVisibilityIndex: number = 0;

  constructor(private props: PublishViewProps) {
    if (this.props.chapters.length > 0) {
      this.selectedChapterIndexes.add(0);
    }
  }

  public getId(): string {
    return 'publish-workflow-view';
  }

  public getTitle(): string {
    return 'PUBLICACIÓN INTERACTIVA EN WATTPAD';
  }

  public getBreadcrumbs(): string[] {
    return ['Wattpad CLI', 'Publicar', `Paso ${this.step} de 5`];
  }

  public getStatusBarHint(): string {
    if (this.step === 2) {
      return '↑/↓ Navegar  ·  Espacio Alternar selección  ·  Enter Continuar  ·  Esc Volver';
    }
    if (this.step === 5) {
      return 'Enter Confirmar publicación  ·  Esc Cancelar';
    }
    return '↑/↓ Seleccionar  ·  Enter Continuar  ·  Esc Volver';
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const w = Math.max(50, width);
    const innerW = w - 4;

    const topBar =
      Chalk.hex(Theme.colors.surfaceBorder, '╭─ ') +
      Chalk.bold(Chalk.hex(Theme.colors.primary, `PUBLICACIÓN EN WATTPAD — PASO ${this.step} DE 5`)) +
      Chalk.hex(Theme.colors.surfaceBorder, ` ${'─'.repeat(Math.max(2, w - 46))}╮`);
    lines.push(topBar);

    // Barra de progreso
    const steps = ['1. Novela', '2. Capítulos', '3. Visibilidad', '4. Resumen', '5. Publicar'];
    const pStr = steps
      .map((st, idx) => {
        const num = idx + 1;
        if (num === this.step) return Chalk.bold(Chalk.hex(Theme.colors.primary, `[● ${st}]`));
        if (num < this.step) return Chalk.hex(Theme.colors.success, `✓ ${st}`);
        return Chalk.dim(`○ ${st}`);
      })
      .join('  ');
    lines.push(
      Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
      padEndVisible(pStr, innerW) +
      Chalk.hex(Theme.colors.surfaceBorder, ' │')
    );
    lines.push(Chalk.hex(Theme.colors.surfaceBorder, `├${'─'.repeat(w - 2)}┤`));

    // Pasos
    if (this.step === 1) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.text, 'Paso 1: Selecciona la novela que deseas publicar:')), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      if (this.props.stories.length === 0) {
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.dim('  No hay novelas registradas en el catálogo local.'), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      } else {
        this.props.stories.forEach((st, idx) => {
          const isSel = idx === this.selectedStoryIndex;
          const marker = isSel ? Chalk.bold(Chalk.hex(Theme.colors.primary, ' › ')) : '   ';
          const title = isSel ? Chalk.bold(Chalk.hex(Theme.colors.primary, st.title)) : Chalk.hex(Theme.colors.text, st.title);
          lines.push(
            Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
            padEndVisible(`${marker}${title} [${st.id}]`, innerW) +
            Chalk.hex(Theme.colors.surfaceBorder, ' │')
          );
        });
      }
    } else if (this.step === 2) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.text, 'Paso 2: Marca los capítulos a publicar (Espacio para marcar/desmarcar):')), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      this.props.chapters.forEach((chap, idx) => {
        const isCursor = idx === this.cursorChapterIndex;
        const isChecked = this.selectedChapterIndexes.has(idx);
        const checkMarker = isChecked ? Chalk.hex(Theme.colors.success, '[✓] ') : Chalk.dim('[ ] ');
        const cursorMarker = isCursor ? Chalk.bold(Chalk.hex(Theme.colors.primary, ' › ')) : '   ';
        const title = isCursor ? Chalk.bold(Chalk.hex(Theme.colors.primary, chap.title)) : Chalk.hex(Theme.colors.text, chap.title);
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(`${cursorMarker}${checkMarker}${title} (${chap.wordCount || 0} palabras)`, innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      });
    } else if (this.step === 3) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.text, 'Paso 3: Elige la visibilidad en Wattpad:')), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      this.visibilityOptions.forEach((opt, idx) => {
        const isSel = idx === this.selectedVisibilityIndex;
        const marker = isSel ? Chalk.bold(Chalk.hex(Theme.colors.primary, ' › ')) : '   ';
        const text = isSel ? Chalk.bold(Chalk.hex(Theme.colors.primary, opt)) : Chalk.hex(Theme.colors.text, opt);
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(`${marker}${text}`, innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      });
    } else if (this.step === 4) {
      const story = this.props.stories[this.selectedStoryIndex];
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.warning, 'Paso 4: Resumen de la publicación')), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.hex(Theme.colors.text, `  Novela:       ${story?.title || 'Mi Novela'}`), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.hex(Theme.colors.text, `  Capítulos:    ${this.selectedChapterIndexes.size} seleccionados`), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.hex(Theme.colors.text, `  Visibilidad:  ${this.visibilityOptions[this.selectedVisibilityIndex]}`), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.primary, '  Pulsa Enter para avanzar a la confirmación')), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    } else if (this.step === 5) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.error, '⚠ ADVERTENCIA DE PUBLICACIÓN')), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim('  Esta acción sincronizará y publicará tus capítulos en tu cuenta de Wattpad.'), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.success, '  Presiona Enter para confirmar y publicar ahora.')), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
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

  public handleKeyPress(str: string, key: readline.Key): boolean | 'pop' {
    if (key.name === 'escape') {
      if (this.step > 1) {
        this.step--;
        return true;
      }
      return 'pop';
    }

    if (this.step === 1) {
      if (key.name === 'up' && this.selectedStoryIndex > 0) this.selectedStoryIndex--;
      if (key.name === 'down' && this.selectedStoryIndex < this.props.stories.length - 1) this.selectedStoryIndex++;
      if (key.name === 'return') this.step = 2;
      return true;
    }

    if (this.step === 2) {
      if (key.name === 'up' && this.cursorChapterIndex > 0) this.cursorChapterIndex--;
      if (key.name === 'down' && this.cursorChapterIndex < this.props.chapters.length - 1) this.cursorChapterIndex++;
      if (key.name === 'space') {
        if (this.selectedChapterIndexes.has(this.cursorChapterIndex)) {
          this.selectedChapterIndexes.delete(this.cursorChapterIndex);
        } else {
          this.selectedChapterIndexes.add(this.cursorChapterIndex);
        }
        return true;
      }
      if (key.name === 'return') this.step = 3;
      return true;
    }

    if (this.step === 3) {
      if (key.name === 'up' && this.selectedVisibilityIndex > 0) this.selectedVisibilityIndex--;
      if (key.name === 'down' && this.selectedVisibilityIndex < this.visibilityOptions.length - 1) this.selectedVisibilityIndex++;
      if (key.name === 'return') this.step = 4;
      return true;
    }

    if (this.step === 4) {
      if (key.name === 'return') this.step = 5;
      return true;
    }

    if (this.step === 5) {
      if (key.name === 'return') {
        if (this.props.onConfirmPublish) {
          const story = this.props.stories[this.selectedStoryIndex];
          const chapIds = Array.from(this.selectedChapterIndexes).map((i) => this.props.chapters[i]?.id || '');
          const vis = this.selectedVisibilityIndex === 0 ? 'public' : 'draft';
          this.props.onConfirmPublish(story?.id || '', chapIds, vis);
        }
        return 'pop';
      }
      return true;
    }

    return true;
  }
}
