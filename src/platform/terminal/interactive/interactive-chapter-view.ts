import readline from 'readline';
import { InteractiveView } from './interactive-view.interface';
import { Chapter } from '../../../features/chapters/types/chapter.types';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface ChapterViewProps {
  storyTitle: string;
  chapters: Chapter[];
  onAction?: (actionId: string, chapter: Chapter) => Promise<void> | void;
}

export class InteractiveChapterView implements InteractiveView {
  private selectedIndex: number = 0;
  private actionMenuOpen: boolean = false;
  private actionMenuIndex: number = 0;

  private actions = [
    { id: 'editor', label: '1. Abrir en editor de terminal', desc: 'Editor multilínea integrado' },
    { id: 'external', label: '2. Abrir en Bloc de Notas / Word', desc: 'Abrir archivo local' },
    { id: 'export', label: '3. Exportar', desc: 'Exportar a DOCX / TXT' },
    { id: 'sync', label: '4. Sincronizar con Wattpad', desc: 'Sincronizar contenido con la nube' },
    { id: 'versions', label: '5. Ver historial de versiones', desc: 'Ver versiones y cambios previos' },
    { id: 'delete', label: '6. Eliminar capítulo', desc: 'Eliminar del workspace' },
  ];

  constructor(private props: ChapterViewProps) {}

  public getId(): string {
    return 'chapters-view';
  }

  public getTitle(): string {
    return `CAPÍTULOS — ${this.props.storyTitle}`;
  }

  public getBreadcrumbs(): string[] {
    return ['Wattpad CLI', this.props.storyTitle, 'Capítulos'];
  }

  public getStatusBarHint(): string {
    if (this.actionMenuOpen) {
      return '↑/↓ Elegir acción  ·  Enter Confirmar  ·  Esc Volver a capítulos';
    }
    return '↑/↓ Seleccionar capítulo  ·  Enter Menú de acciones  ·  Esc Volver';
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const w = Math.max(50, width);
    const innerW = w - 4;
    const chapters = this.props.chapters;

    if (this.selectedIndex >= chapters.length) {
      this.selectedIndex = Math.max(0, chapters.length - 1);
    }

    // Cabecera
    const topBar =
      Chalk.hex(Theme.colors.surfaceBorder, '╭─ ') +
      Chalk.bold(Chalk.hex(Theme.colors.primary, `CAPÍTULOS: ${this.props.storyTitle}`)) +
      Chalk.hex(Theme.colors.surfaceBorder, ` ${'─'.repeat(Math.max(2, w - this.props.storyTitle.length - 15))}╮`);
    lines.push(topBar);

    if (this.actionMenuOpen) {
      const selectedChap = chapters[this.selectedIndex];
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.warning, `  OPCIONES PARA: ${selectedChap?.title || 'Capítulo'}`)), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim('  Selecciona una opción con ↑/↓ y pulsa Enter:'), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible('', innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );

      this.actions.forEach((act, idx) => {
        const isActSelected = idx === this.actionMenuIndex;
        const marker = isActSelected ? Chalk.bold(Chalk.hex(Theme.colors.primary, ' › ')) : '   ';
        const labelStr = isActSelected
          ? Chalk.bold(Chalk.hex(Theme.colors.primary, act.label))
          : Chalk.hex(Theme.colors.text, act.label);
        const descStr = Chalk.dim(` — ${act.desc}`);
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(`${marker}${labelStr}${descStr}`, innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      });

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

    // Listado de Capítulos
    const capacity = Math.max(4, height - 7);
    let startIdx = 0;
    if (this.selectedIndex >= capacity) {
      startIdx = this.selectedIndex - capacity + 1;
    }
    const visibleChapters = chapters.slice(startIdx, startIdx + capacity);

    if (chapters.length === 0) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim('  Esta novela no tiene capítulos aún. Escribe /chapter new "Título" para crear uno.'), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    } else {
      visibleChapters.forEach((chap, relIdx) => {
        const absIdx = startIdx + relIdx;
        const isSelected = absIdx === this.selectedIndex;
        const marker = isSelected ? Chalk.bold(Chalk.hex(Theme.colors.primary, ' › ')) : '   ';
        const numStr = Chalk.dim(`[${chap.id}] `);
        const titleStr = isSelected ? Chalk.bold(Chalk.hex(Theme.colors.primary, chap.title)) : Chalk.hex(Theme.colors.text, chap.title);
        const wordsStr = Chalk.dim(` · ${chap.wordCount || 0} palabras`);
        const isPub = chap.status === 'published';
        const statusBadge = isPub ? Chalk.hex(Theme.colors.success, '[Publicado]') : Chalk.hex(Theme.colors.warning, '[Borrador]');

        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(`${marker}${numStr}${titleStr}${wordsStr}  ${statusBadge}`, innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      });
    }

    while (lines.length < capacity + 3) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible('', innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    }

    lines.push(Chalk.hex(Theme.colors.surfaceBorder, `├${'─'.repeat(w - 2)}┤`));
    const selChap = chapters[this.selectedIndex];
    if (selChap) {
      const info = `Capítulo: ${selChap.title}  ·  Palabras: ${selChap.wordCount || 0}  ·  Enter: Submenú de acciones`;
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.hex(Theme.colors.info, info), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim('Usa ↑ y ↓ para navegar entre capítulos. Enter para abrir el submenú.'), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    } else {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim('Usa /chapter new para agregar un nuevo capítulo.'), innerW) +
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
    const chapters = this.props.chapters;

    if (key.name === 'escape') {
      if (this.actionMenuOpen) {
        this.actionMenuOpen = false;
        return true;
      }
      return 'pop';
    }

    if (this.actionMenuOpen) {
      if (key.name === 'up') {
        this.actionMenuIndex = Math.max(0, this.actionMenuIndex - 1);
        return true;
      }
      if (key.name === 'down') {
        this.actionMenuIndex = Math.min(this.actions.length - 1, this.actionMenuIndex + 1);
        return true;
      }
      if (key.name === 'return') {
        const action = this.actions[this.actionMenuIndex];
        const chap = chapters[this.selectedIndex];
        this.actionMenuOpen = false;
        if (this.props.onAction && action && chap) {
          this.props.onAction(action.id, chap);
        }
        return 'pop';
      }
      return true;
    }

    if (key.name === 'up') {
      if (this.selectedIndex > 0) {
        this.selectedIndex--;
      }
      return true;
    }

    if (key.name === 'down') {
      if (this.selectedIndex < chapters.length - 1) {
        this.selectedIndex++;
      }
      return true;
    }

    if (key.name === 'return') {
      if (chapters.length > 0) {
        this.actionMenuOpen = true;
        this.actionMenuIndex = 0;
      }
      return true;
    }

    return true;
  }
}
