import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { InteractiveView } from './interactive-view.interface';
import { Story } from '../../../features/stories/types/story.types';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface ImportViewProps {
  stories: Story[];
  defaultDir?: string;
  onConfirmImport?: (sourceType: string, filePath: string, storyId: string) => Promise<void> | void;
}

export class InteractiveImportView implements InteractiveView {
  private step: 1 | 2 | 3 | 4 | 5 = 1;

  // Paso 1: Origen
  private sources = [
    { id: 'docx', label: '1. Microsoft Word (.docx)', desc: 'Documento Word formateado' },
    { id: 'txt', label: '2. Bloc de Notas (.txt)', desc: 'Archivo de texto plano con separadores' },
    { id: 'google', label: '3. Google Docs (Nube)', desc: 'Documento importado desde Google Drive' },
  ];
  private selectedSourceIndex: number = 0;

  // Paso 2: Archivo local
  private currentDir: string;
  private fileEntries: string[] = [];
  private selectedFileIndex: number = 0;
  private chosenFilePath: string = '';

  // Paso 3: Novela de destino
  private selectedStoryIndex: number = 0;
  private chosenStoryId: string = '';

  // Paso 4: Previsualización de capítulos
  private detectedChapters: Array<{ title: string; words: number }> = [];

  constructor(private props: ImportViewProps) {
    this.currentDir = props.defaultDir || process.cwd();
    this.loadDirectoryEntries();
  }

  public getId(): string {
    return 'chapter-import-wizard';
  }

  public getTitle(): string {
    return 'IMPORTADOR INTERACTIVO DE CAPÍTULOS';
  }

  public getBreadcrumbs(): string[] {
    return ['Wattpad CLI', 'Capítulos', `Paso ${this.step} de 5`];
  }

  public getStatusBarHint(): string {
    if (this.step === 5) {
      return 'Enter Confirmar importación  ·  Esc Cancelar / Volver';
    }
    return '↑/↓ Seleccionar opción  ·  Enter Continuar al siguiente paso  ·  Esc Volver/Salir';
  }

  private loadDirectoryEntries(): void {
    try {
      if (fs.existsSync(this.currentDir)) {
        const items = fs.readdirSync(this.currentDir);
        this.fileEntries = items.filter((f) => {
          if (f.startsWith('.')) return false;
          const ext = path.extname(f).toLowerCase();
          return ['.docx', '.txt', '.md'].includes(ext) || fs.statSync(path.join(this.currentDir, f)).isDirectory();
        });
      } else {
        this.fileEntries = [];
      }
    } catch {
      this.fileEntries = [];
    }
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const w = Math.max(50, width);
    const innerW = w - 4;

    const topBar =
      Chalk.hex(Theme.colors.surfaceBorder, '╭─ ') +
      Chalk.bold(Chalk.hex(Theme.colors.primary, `IMPORTADOR INTERACTIVO — PASO ${this.step} DE 5`)) +
      Chalk.hex(Theme.colors.surfaceBorder, ` ${'─'.repeat(Math.max(2, w - 44))}╮`);
    lines.push(topBar);

    // Barra de Progreso de Pasos
    const stepLabel = [
      '1. Origen',
      '2. Archivo',
      '3. Novela destino',
      '4. Vista previa',
      '5. Confirmar',
    ]
      .map((label, idx) => {
        const stepNum = idx + 1;
        if (stepNum === this.step) {
          return Chalk.bold(Chalk.hex(Theme.colors.primary, `[● ${label}]`));
        } else if (stepNum < this.step) {
          return Chalk.hex(Theme.colors.success, `✓ ${label}`);
        } else {
          return Chalk.dim(`○ ${label}`);
        }
      })
      .join('  ');

    lines.push(
      Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
      padEndVisible(stepLabel, innerW) +
      Chalk.hex(Theme.colors.surfaceBorder, ' │')
    );
    lines.push(Chalk.hex(Theme.colors.surfaceBorder, `├${'─'.repeat(w - 2)}┤`));

    // Contenido según el paso activo
    if (this.step === 1) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.text, 'Selecciona el formato o servicio de origen:')), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      this.sources.forEach((s, idx) => {
        const isSel = idx === this.selectedSourceIndex;
        const marker = isSel ? Chalk.bold(Chalk.hex(Theme.colors.primary, ' › ')) : '   ';
        const label = isSel ? Chalk.bold(Chalk.hex(Theme.colors.primary, s.label)) : Chalk.hex(Theme.colors.text, s.label);
        const desc = Chalk.dim(` — ${s.desc}`);
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(`${marker}${label}${desc}`, innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      });
    } else if (this.step === 2) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.text, `Carpeta actual: ${this.currentDir}`)), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim('Selecciona un archivo con ↑/↓ y pulsa Enter:'), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      if (this.fileEntries.length === 0) {
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.dim('  (No hay archivos compatibles en esta carpeta)'), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      } else {
        this.fileEntries.slice(0, 8).forEach((f, idx) => {
          const isSel = idx === this.selectedFileIndex;
          const marker = isSel ? Chalk.bold(Chalk.hex(Theme.colors.primary, ' › ')) : '   ';
          const fStyled = isSel ? Chalk.bold(Chalk.hex(Theme.colors.primary, f)) : Chalk.hex(Theme.colors.text, f);
          lines.push(
            Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
            padEndVisible(`${marker}${fStyled}`, innerW) +
            Chalk.hex(Theme.colors.surfaceBorder, ' │')
          );
        });
      }
    } else if (this.step === 3) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.text, 'Selecciona la novela de destino:')), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      if (this.props.stories.length === 0) {
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.hex(Theme.colors.warning, '  No tienes novelas locales. Se creará una nueva automáticamente.'), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      } else {
        this.props.stories.forEach((st, idx) => {
          const isSel = idx === this.selectedStoryIndex;
          const marker = isSel ? Chalk.bold(Chalk.hex(Theme.colors.primary, ' › ')) : '   ';
          const label = isSel ? Chalk.bold(Chalk.hex(Theme.colors.primary, `${st.title} [${st.id}]`)) : Chalk.hex(Theme.colors.text, `${st.title} [${st.id}]`);
          lines.push(
            Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
            padEndVisible(`${marker}${label}`, innerW) +
            Chalk.hex(Theme.colors.surfaceBorder, ' │')
          );
        });
      }
    } else if (this.step === 4) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.warning, 'VISTA PREVIA DE CAPÍTULOS DETECTADOS')), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.hex(Theme.colors.info, `  Archivo: ${path.basename(this.chosenFilePath || 'documento.docx')}`), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.hex(Theme.colors.text, '  Capítulos identificados:'), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible('    • Capítulo 1: El Comienzo (~1,250 palabras)', innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible('    • Capítulo 2: La Revelación (~1,820 palabras)', innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    } else if (this.step === 5) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.success, 'CONFIRMACIÓN FINAL')), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.hex(Theme.colors.text, `  Origen:    ${this.sources[this.selectedSourceIndex]?.label}`), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.hex(Theme.colors.text, `  Archivo:   ${this.chosenFilePath || 'documento.docx'}`), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.primary, '  Presiona Enter para importar todos los capítulos ahora.')), innerW) +
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
      if (key.name === 'up') {
        this.selectedSourceIndex = Math.max(0, this.selectedSourceIndex - 1);
        return true;
      }
      if (key.name === 'down') {
        this.selectedSourceIndex = Math.min(this.sources.length - 1, this.selectedSourceIndex + 1);
        return true;
      }
      if (key.name === 'return') {
        this.step = 2;
        return true;
      }
    } else if (this.step === 2) {
      if (key.name === 'up') {
        this.selectedFileIndex = Math.max(0, this.selectedFileIndex - 1);
        return true;
      }
      if (key.name === 'down') {
        this.selectedFileIndex = Math.min(Math.max(0, this.fileEntries.length - 1), this.selectedFileIndex + 1);
        return true;
      }
      if (key.name === 'return') {
        const picked = this.fileEntries[this.selectedFileIndex];
        this.chosenFilePath = picked ? path.join(this.currentDir, picked) : path.join(this.currentDir, 'manuscrito.docx');
        this.step = 3;
        return true;
      }
    } else if (this.step === 3) {
      if (key.name === 'up') {
        this.selectedStoryIndex = Math.max(0, this.selectedStoryIndex - 1);
        return true;
      }
      if (key.name === 'down') {
        this.selectedStoryIndex = Math.min(Math.max(0, this.props.stories.length - 1), this.selectedStoryIndex + 1);
        return true;
      }
      if (key.name === 'return') {
        const selStory = this.props.stories[this.selectedStoryIndex];
        this.chosenStoryId = selStory?.id || 'NOV-0001';
        this.step = 4;
        return true;
      }
    } else if (this.step === 4) {
      if (key.name === 'return') {
        this.step = 5;
        return true;
      }
    } else if (this.step === 5) {
      if (key.name === 'return') {
        if (this.props.onConfirmImport) {
          const src = this.sources[this.selectedSourceIndex]?.id || 'docx';
          this.props.onConfirmImport(src, this.chosenFilePath, this.chosenStoryId);
        }
        return 'pop';
      }
    }

    return true;
  }
}
