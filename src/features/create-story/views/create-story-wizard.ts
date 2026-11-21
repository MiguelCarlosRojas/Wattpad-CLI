import { ViewInterface, KeyPressEvent } from '../../../shared/types/navigation.types';
import { StoryCreationService, CreateStoryPayload } from '../story-creation-service';
import { HeaderComponent } from '../../../platform/terminal/components/header';
import { FooterComponent } from '../../../platform/terminal/components/footer';
import { SessionManager } from '../../../auth/session/session-manager';
import { COLORS } from '../../../shared/constants/colors.constants';

export class CreateStoryWizard implements ViewInterface {
  public id = 'create-story' as const;
  private currentStep: 1 | 2 | 3 | 4 | 5 = 1;

  // Form fields
  private title = '';
  private description = '';
  private genre = 'Fantasía';
  private tagsStr = '';
  private coverPath = '';
  private rating: 'everyone' | 'mature' = 'everyone';
  private copyright = 'Todos los derechos reservados';

  private activeFieldIdx = 0; // For step 1 fields
  private statusMessage = '';
  private onFinished: () => void;
  private onCancel: () => void;

  private genresList = ['Fantasía', 'Romance', 'Ciencia ficción', 'Misterio', 'Terror', 'Aventura', 'Drama', 'Acción', 'Juvenil'];

  constructor(onFinished: () => void, onCancel: () => void) {
    this.onFinished = onFinished;
    this.onCancel = onCancel;
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const user = SessionManager.getUsername();

    lines.push(...HeaderComponent.render({ width, connectedUser: user }));
    lines.push(`  ${COLORS.BOLD}${COLORS.ORANGE}Asistente para Crear Historia — Paso ${this.currentStep} de 5${COLORS.RESET}`);
    lines.push('');

    if (this.currentStep === 1) {
      lines.push(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Paso 1: Información Principal${COLORS.RESET}`);
      lines.push(`  ${COLORS.TEXT_MUTED}Usa ↑↓ para cambiar de campo, escribe tu texto y presiona Enter al terminar.${COLORS.RESET}`);
      lines.push('');

      const f0Pointer = this.activeFieldIdx === 0 ? `${COLORS.ORANGE}❯ Título:${COLORS.RESET}` : `  Título:`;
      lines.push(`  ${f0Pointer} ${COLORS.TEXT_MAIN}${this.title}${this.activeFieldIdx === 0 ? '_' : ''}${COLORS.RESET}`);

      const f1Pointer = this.activeFieldIdx === 1 ? `${COLORS.ORANGE}❯ Descripción:${COLORS.RESET}` : `  Descripción:`;
      lines.push(`  ${f1Pointer} ${COLORS.TEXT_MAIN}${this.description}${this.activeFieldIdx === 1 ? '_' : ''}${COLORS.RESET}`);

      const f2Pointer = this.activeFieldIdx === 2 ? `${COLORS.ORANGE}❯ Género:${COLORS.RESET}` : `  Género:`;
      lines.push(`  ${f2Pointer} ${COLORS.ORANGE}◄ ${this.genre} ►${COLORS.RESET} ${COLORS.TEXT_DIM}(Usa ←→ para cambiar)${COLORS.RESET}`);

      const f3Pointer = this.activeFieldIdx === 3 ? `${COLORS.ORANGE}❯ Etiquetas:${COLORS.RESET}` : `  Etiquetas:`;
      lines.push(`  ${f3Pointer} ${COLORS.TEXT_MAIN}${this.tagsStr}${this.activeFieldIdx === 3 ? '_' : ''}${COLORS.RESET} ${COLORS.TEXT_DIM}(separadas por comas)${COLORS.RESET}`);
      lines.push('');
      lines.push(`  ${COLORS.TEXT_DIM}Presiona Tab para avanzar al Paso 2 cuando tengas el título listo.${COLORS.RESET}`);
    } else if (this.currentStep === 2) {
      lines.push(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Paso 2: Portada de la Novela${COLORS.RESET}`);
      lines.push(`  ${COLORS.TEXT_MUTED}Selecciona una imagen local (.jpg, .png) o déjala en blanco para continuar.${COLORS.RESET}`);
      lines.push('');
      lines.push(`  ${COLORS.ORANGE}❯ Ruta de imagen:${COLORS.RESET} ${this.coverPath}_`);
      lines.push('');
      lines.push(`  ${COLORS.TEXT_DIM}[Enter o Tab para continuar al Paso 3, Esc para volver]${COLORS.RESET}`);
    } else if (this.currentStep === 3) {
      lines.push(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Paso 3: Detalles de Publicación${COLORS.RESET}`);
      lines.push(`  ${COLORS.TEXT_MUTED}Configura la clasificación de la obra (Usa ←→ para alternar):${COLORS.RESET}`);
      lines.push('');
      lines.push(`  ${COLORS.ORANGE}❯ Clasificación de contenido:${COLORS.RESET} ${this.rating === 'everyone' ? `${COLORS.SUCCESS}Todo público (Para todas las edades)${COLORS.RESET}` : `${COLORS.WARNING}Contenido adulto (+18)${COLORS.RESET}`}`);
      lines.push(`  ${COLORS.TEXT_MUTED}Derechos de autor:${COLORS.RESET} ${this.copyright}`);
      lines.push('');
      lines.push(`  ${COLORS.TEXT_DIM}[Enter o Tab para avanzar a la Revisión, Esc para volver]${COLORS.RESET}`);
    } else if (this.currentStep === 4) {
      lines.push(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Paso 4: Revisión del Manuscrito${COLORS.RESET}`);
      lines.push(`  ${COLORS.TEXT_MUTED}Comprueba los datos antes de guardar la nueva historia:${COLORS.RESET}`);
      lines.push('');
      lines.push(`    ${COLORS.TEXT_MUTED}Título:${COLORS.RESET}        ${COLORS.BOLD}${COLORS.TEXT_MAIN}${this.title}${COLORS.RESET}`);
      lines.push(`    ${COLORS.TEXT_MUTED}Género:${COLORS.RESET}        ${this.genre}`);
      lines.push(`    ${COLORS.TEXT_MUTED}Descripción:${COLORS.RESET}   ${this.description || '(Sin descripción)'}`);
      lines.push(`    ${COLORS.TEXT_MUTED}Etiquetas:${COLORS.RESET}     ${this.tagsStr || '(Ninguna)'}`);
      lines.push(`    ${COLORS.TEXT_MUTED}Clasificación:${COLORS.RESET} ${this.rating === 'everyone' ? 'Todo público' : 'Adultos (+18)'}`);
      lines.push(`    ${COLORS.TEXT_MUTED}Ubicación:${COLORS.RESET}     Directorio local (~/.wattpad/manuscripts/stories/)`);
      lines.push('');
      lines.push(`  ${COLORS.TEXT_MUTED}[Presiona Enter para Confirmar y Guardar, Esc para modificar]${COLORS.RESET}`);
    } else if (this.currentStep === 5) {
      lines.push(`  ${COLORS.BOLD}${COLORS.SUCCESS}✓ ¡Historia Creada Exitosamente!${COLORS.RESET}`);
      lines.push('');
      lines.push(`  Tu historia "${this.title}" se ha guardado localmente en tu biblioteca de autor.`);
      lines.push(`  Estado: ${COLORS.WARNING}MANUSCRITO LOCAL${COLORS.RESET} (No publicado en Wattpad aún).`);
      lines.push(`  Puedes comenzar a escribir capítulos de inmediato desde "Mis historias".`);
      lines.push('');
      lines.push(`  ${COLORS.TEXT_DIM}[Presiona Enter para ir a Mis Historias]${COLORS.RESET}`);
    }

    if (this.statusMessage) {
      lines.push(`  ${this.statusMessage}`);
      lines.push('');
    }

    const currentLines = lines.length;
    const remaining = Math.max(1, height - currentLines - 4);
    for (let i = 0; i < remaining; i++) {
      lines.push('');
    }

    lines.push(...FooterComponent.render(['Tab Siguiente paso', 'Esc Volver / Cancelar', 'Enter Confirmar'], width));
    return lines;
  }

  public async handleKey(event: KeyPressEvent): Promise<void> {
    if (this.currentStep === 1) {
      if (event.key === 'escape') {
        this.onCancel();
        return;
      }
      if (event.key === 'up') {
        this.activeFieldIdx = (this.activeFieldIdx - 1 + 4) % 4;
        return;
      }
      if (event.key === 'down' || event.key === 'enter') {
        if (this.activeFieldIdx === 3 && this.title.trim()) {
          this.currentStep = 2;
        } else {
          this.activeFieldIdx = (this.activeFieldIdx + 1) % 4;
        }
        return;
      }
      if (event.key === 'tab') {
        if (this.title.trim()) {
          this.currentStep = 2;
        } else {
          this.statusMessage = `${COLORS.ERROR}Por favor ingresa al menos un título para la historia.${COLORS.RESET}`;
        }
        return;
      }

      // Manejo de valores de campo
      if (this.activeFieldIdx === 0) {
        if (event.key === 'backspace') this.title = this.title.slice(0, -1);
        else if (event.key.length === 1 && !event.ctrl && !event.alt) this.title += event.key;
      } else if (this.activeFieldIdx === 1) {
        if (event.key === 'backspace') this.description = this.description.slice(0, -1);
        else if (event.key.length === 1 && !event.ctrl && !event.alt) this.description += event.key;
      } else if (this.activeFieldIdx === 2) {
        const curIdx = this.genresList.indexOf(this.genre);
        if (event.key === 'left') {
          this.genre = this.genresList[(curIdx - 1 + this.genresList.length) % this.genresList.length];
        } else if (event.key === 'right') {
          this.genre = this.genresList[(curIdx + 1) % this.genresList.length];
        }
      } else if (this.activeFieldIdx === 3) {
        if (event.key === 'backspace') this.tagsStr = this.tagsStr.slice(0, -1);
        else if (event.key.length === 1 && !event.ctrl && !event.alt) this.tagsStr += event.key;
      }
      return;
    }

    if (this.currentStep === 2) {
      if (event.key === 'escape') {
        this.currentStep = 1;
        return;
      }
      if (event.key === 'enter' || event.key === 'tab') {
        this.currentStep = 3;
        return;
      }
      if (event.key === 'backspace') {
        this.coverPath = this.coverPath.slice(0, -1);
      } else if (event.key.length === 1 && !event.ctrl && !event.alt) {
        this.coverPath += event.key;
      }
      return;
    }

    if (this.currentStep === 3) {
      if (event.key === 'escape') {
        this.currentStep = 2;
        return;
      }
      if (event.key === 'left' || event.key === 'right') {
        this.rating = this.rating === 'everyone' ? 'mature' : 'everyone';
        return;
      }
      if (event.key === 'enter' || event.key === 'tab') {
        this.currentStep = 4;
        return;
      }
      return;
    }

    if (this.currentStep === 4) {
      if (event.key === 'escape') {
        this.currentStep = 3;
        return;
      }
      if (event.key === 'enter') {
        const tags = this.tagsStr
          .split(',')
          .map((t) => t.trim().replace(/^#/, ''))
          .filter(Boolean);

        const payload: CreateStoryPayload = {
          title: this.title,
          description: this.description,
          language: 'es',
          genre: this.genre,
          tags,
          coverPath: this.coverPath || undefined,
          rating: this.rating,
          copyright: this.copyright,
        };

        await StoryCreationService.createStory(payload);
        this.currentStep = 5;
        return;
      }
      return;
    }

    if (this.currentStep === 5) {
      if (event.key === 'enter' || event.key === 'escape') {
        this.onFinished();
      }
    }
  }
}
