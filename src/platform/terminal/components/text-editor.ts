import fs from 'fs';
import path from 'path';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface TextEditorState {
  title: string;
  sourcePath?: string;
  lines: string[];
  cursorRow: number;
  cursorCol: number;
  viewportTop: number;
  isDirty: boolean;
  searchOpen: boolean;
  searchQuery: string;
  statusMessage?: string | null;
}

export class TextEditor {
  private state: TextEditorState;

  constructor(initial: {
    title: string;
    content: string;
    sourcePath?: string;
  }) {
    const rawLines = initial.content.split('\n');
    this.state = {
      title: initial.title,
      sourcePath: initial.sourcePath,
      lines: rawLines.length > 0 ? rawLines : [''],
      cursorRow: 0,
      cursorCol: 0,
      viewportTop: 0,
      isDirty: false,
      searchOpen: false,
      searchQuery: '',
      statusMessage: null,
    };
  }

  public getState(): TextEditorState {
    return this.state;
  }

  public getContent(): string {
    return this.state.lines.join('\n');
  }

  public isDirty(): boolean {
    return this.state.isDirty;
  }

  public markClean(): void {
    this.state.isDirty = false;
  }

  public insertChar(char: string): void {
    const row = this.state.cursorRow;
    const col = this.state.cursorCol;
    const line = this.state.lines[row] || '';

    this.state.lines[row] = line.slice(0, col) + char + line.slice(col);
    this.state.cursorCol += char.length;
    this.state.isDirty = true;
  }

  public insertNewline(): void {
    const row = this.state.cursorRow;
    const col = this.state.cursorCol;
    const line = this.state.lines[row] || '';

    const firstHalf = line.slice(0, col);
    const secondHalf = line.slice(col);

    this.state.lines[row] = firstHalf;
    this.state.lines.splice(row + 1, 0, secondHalf);
    this.state.cursorRow++;
    this.state.cursorCol = 0;
    this.state.isDirty = true;
  }

  public backspace(): void {
    const row = this.state.cursorRow;
    const col = this.state.cursorCol;

    if (col > 0) {
      const line = this.state.lines[row];
      this.state.lines[row] = line.slice(0, col - 1) + line.slice(col);
      this.state.cursorCol--;
      this.state.isDirty = true;
    } else if (row > 0) {
      // Unir la línea actual con la línea anterior
      const prevLine = this.state.lines[row - 1];
      const curLine = this.state.lines[row];
      this.state.cursorCol = prevLine.length;
      this.state.lines[row - 1] = prevLine + curLine;
      this.state.lines.splice(row, 1);
      this.state.cursorRow--;
      this.state.isDirty = true;
    }
  }

  public deleteChar(): void {
    const row = this.state.cursorRow;
    const col = this.state.cursorCol;
    const line = this.state.lines[row];

    if (col < line.length) {
      this.state.lines[row] = line.slice(0, col) + line.slice(col + 1);
      this.state.isDirty = true;
    } else if (row < this.state.lines.length - 1) {
      const nextLine = this.state.lines[row + 1];
      this.state.lines[row] = line + nextLine;
      this.state.lines.splice(row + 1, 1);
      this.state.isDirty = true;
    }
  }

  public moveCursor(direction: 'up' | 'down' | 'left' | 'right'): void {
    switch (direction) {
      case 'up':
        if (this.state.cursorRow > 0) {
          this.state.cursorRow--;
          const maxCol = this.state.lines[this.state.cursorRow].length;
          if (this.state.cursorCol > maxCol) this.state.cursorCol = maxCol;
        }
        break;
      case 'down':
        if (this.state.cursorRow < this.state.lines.length - 1) {
          this.state.cursorRow++;
          const maxCol = this.state.lines[this.state.cursorRow].length;
          if (this.state.cursorCol > maxCol) this.state.cursorCol = maxCol;
        }
        break;
      case 'left':
        if (this.state.cursorCol > 0) {
          this.state.cursorCol--;
        } else if (this.state.cursorRow > 0) {
          this.state.cursorRow--;
          this.state.cursorCol = this.state.lines[this.state.cursorRow].length;
        }
        break;
      case 'right':
        if (this.state.cursorCol < this.state.lines[this.state.cursorRow].length) {
          this.state.cursorCol++;
        } else if (this.state.cursorRow < this.state.lines.length - 1) {
          this.state.cursorRow++;
          this.state.cursorCol = 0;
        }
        break;
    }
  }

  public moveToLineStart(): void {
    this.state.cursorCol = 0;
  }

  public moveToLineEnd(): void {
    this.state.cursorCol = this.state.lines[this.state.cursorRow]?.length || 0;
  }

  public pageUp(linesPerPage: number = 10): void {
    this.state.cursorRow = Math.max(0, this.state.cursorRow - linesPerPage);
    const maxCol = this.state.lines[this.state.cursorRow].length;
    if (this.state.cursorCol > maxCol) this.state.cursorCol = maxCol;
  }

  public pageDown(linesPerPage: number = 10): void {
    this.state.cursorRow = Math.min(this.state.lines.length - 1, this.state.cursorRow + linesPerPage);
    const maxCol = this.state.lines[this.state.cursorRow].length;
    if (this.state.cursorCol > maxCol) this.state.cursorCol = maxCol;
  }

  public setSearchQuery(q: string): void {
    this.state.searchQuery = q;
  }

  public toggleSearch(): void {
    this.state.searchOpen = !this.state.searchOpen;
    if (!this.state.searchOpen) {
      this.state.searchQuery = '';
    }
  }

  public findNext(): boolean {
    const q = this.state.searchQuery.toLowerCase();
    if (!q) return false;

    // Buscar desde el cursor hacia adelante
    for (let r = this.state.cursorRow; r < this.state.lines.length; r++) {
      const line = this.state.lines[r].toLowerCase();
      const startCol = r === this.state.cursorRow ? this.state.cursorCol + 1 : 0;
      const foundIdx = line.indexOf(q, startCol);
      if (foundIdx !== -1) {
        this.state.cursorRow = r;
        this.state.cursorCol = foundIdx;
        return true;
      }
    }

    // Wrap around desde el principio
    for (let r = 0; r <= this.state.cursorRow; r++) {
      const line = this.state.lines[r].toLowerCase();
      const foundIdx = line.indexOf(q, 0);
      if (foundIdx !== -1) {
        this.state.cursorRow = r;
        this.state.cursorCol = foundIdx;
        return true;
      }
    }

    return false;
  }

  /**
   * Guarda el contenido actual y crea una copia de respaldo de seguridad (.bak)
   */
  public saveWithBackup(destinationPath?: string): { success: boolean; path: string; backupPath?: string; error?: string } {
    const target = destinationPath || this.state.sourcePath;
    if (!target) {
      return { success: false, path: '', error: 'Ruta de archivo no especificada para guardar.' };
    }

    try {
      let backupPath: string | undefined;

      // Crear copia .bak si el archivo original ya existe
      if (fs.existsSync(target)) {
        backupPath = `${target}.bak`;
        fs.copyFileSync(target, backupPath);
      }

      const dir = path.dirname(target);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(target, this.getContent(), 'utf8');
      this.state.isDirty = false;
      this.state.statusMessage = `Guardado exitosamente${backupPath ? ` (Respaldo: ${path.basename(backupPath)})` : ''}`;

      return {
        success: true,
        path: target,
        backupPath,
      };
    } catch (err: any) {
      return {
        success: false,
        path: target,
        error: `Error al guardar archivo: ${err.message}`,
      };
    }
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const termWidth = Math.max(50, width);
    const innerWidth = termWidth - 4;
    const viewHeight = Math.max(8, height);

    // Ajustar viewportTop para que el cursor siempre sea visible
    const gutterWidth = Math.max(4, String(this.state.lines.length).length + 2);
    const editorContentHeight = viewHeight - 4; // Top header, separator, status line, bottom border

    if (this.state.cursorRow < this.state.viewportTop) {
      this.state.viewportTop = this.state.cursorRow;
    } else if (this.state.cursorRow >= this.state.viewportTop + editorContentHeight) {
      this.state.viewportTop = this.state.cursorRow - editorContentHeight + 1;
    }

    // 1. Header del Editor
    const dirtyMarker = this.state.isDirty ? Chalk.bold(Chalk.hex(Theme.colors.warning, ' [Modificado *]')) : '';
    const topBorder =
      Chalk.hex(Theme.colors.surfaceBorder, '╭─ ') +
      Chalk.bold(Chalk.hex(Theme.colors.primary, `EDITOR: ${this.state.title}`)) +
      dirtyMarker +
      Chalk.hex(Theme.colors.surfaceBorder, ` ${'─'.repeat(Math.max(2, termWidth - this.state.title.length - 20))}╮`);
    lines.push(topBorder);

    // 2. Barra de Búsqueda si está activa
    if (this.state.searchOpen) {
      const searchLine = Chalk.hex(Theme.colors.warning, `Buscar: ${this.state.searchQuery}█`) + Chalk.dim('  (Enter: siguiente, Esc: cerrar)');
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(searchLine, innerWidth) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(Chalk.hex(Theme.colors.surfaceBorder, `├${'─'.repeat(termWidth - 2)}┤`));
    }

    // 3. Líneas de Contenido con Gutter
    const endRow = Math.min(this.state.lines.length, this.state.viewportTop + editorContentHeight);

    for (let r = this.state.viewportTop; r < endRow; r++) {
      const lineNum = String(r + 1).padStart(gutterWidth - 1, ' ');
      const gutter = Chalk.dim(`${lineNum} │ `);

      const rawLine = this.state.lines[r] || '';
      const isCurrentRow = r === this.state.cursorRow;

      let renderedLine = '';
      if (isCurrentRow) {
        const col = Math.min(this.state.cursorCol, rawLine.length);
        const beforeCursor = rawLine.slice(0, col);
        const atCursor = rawLine.slice(col, col + 1) || ' ';
        const afterCursor = rawLine.slice(col + 1);

        // Resaltar cursor en terminal
        const cursorChar = Chalk.inverse(atCursor);
        renderedLine = `${beforeCursor}${cursorChar}${afterCursor}`;
      } else {
        renderedLine = rawLine;
      }

      // Resaltar coincidencias de búsqueda si está activa
      if (this.state.searchQuery) {
        const q = this.state.searchQuery;
        const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        renderedLine = renderedLine.replace(regex, Chalk.inverse(Chalk.bold('$1')));
      }

      const availableTextWidth = innerWidth - gutterWidth - 2;
      const truncated = renderedLine.length > availableTextWidth ? renderedLine.slice(0, availableTextWidth) : renderedLine;

      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(`${gutter}${truncated}`, innerWidth) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    }

    // Rellenar líneas vacías si el contenido es menor que la altura
    const renderedCount = endRow - this.state.viewportTop;
    for (let i = renderedCount; i < editorContentHeight; i++) {
      const emptyGutter = Chalk.dim(`${' '.repeat(gutterWidth - 1)} ~ `);
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(emptyGutter, innerWidth) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    }

    // 4. Barra de Estado Inferior del Editor
    const allText = this.getContent();
    const words = allText.trim() ? allText.trim().split(/\s+/).length : 0;
    const chars = allText.length;
    const curLine = this.state.cursorRow + 1;
    const curCol = this.state.cursorCol + 1;

    const stats = `Palabras: ${words.toLocaleString()} | Caracteres: ${chars.toLocaleString()} | L:${curLine}/${this.state.lines.length} C:${curCol}`;
    const shortcuts = `Ctrl+S Guardar | Ctrl+F Buscar | Esc Salir`;
    const statusBar = `${Chalk.dim(stats)}  ·  ${Chalk.hex(Theme.colors.info, shortcuts)}`;

    lines.push(Chalk.hex(Theme.colors.surfaceBorder, `├${'─'.repeat(termWidth - 2)}┤`));
    lines.push(
      Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
      padEndVisible(statusBar, innerWidth) +
      Chalk.hex(Theme.colors.surfaceBorder, ' │')
    );

    const bottomBorder = Chalk.hex(Theme.colors.surfaceBorder, `╰${'─'.repeat(termWidth - 2)}╯`);
    lines.push(bottomBorder);

    return lines;
  }
}
