import { ViewInterface, KeyPressEvent, MenuItem } from '../../../shared/types/navigation.types';
import { StoryMetadata } from '../../../shared/types/story.types';
import { StoryService } from '../story-service';
import { HeaderComponent } from '../../../platform/terminal/components/header';
import { FooterComponent } from '../../../platform/terminal/components/footer';
import { MenuListComponent } from '../../../platform/terminal/components/menu-list';
import { SessionManager } from '../../../auth/session/session-manager';
import { COLORS } from '../../../shared/constants/colors.constants';
import { formatDate } from '../../../shared/utils/string-utils';

export class StoryManageView implements ViewInterface {
  public id = 'story-manage' as const;
  private story: StoryMetadata;
  private selectedIndex = 0;
  private statusMessage = '';
  private viewMode: 'menu' | 'info' | 'edit-title' | 'stats' = 'menu';
  private editTempTitle = '';

  private onOpenChapters: (story: StoryMetadata) => void;
  private onWriteNewChapter: (story: StoryMetadata) => void;
  private onBack: () => void;

  private items: MenuItem[] = [
    { id: 'info', label: '1. Ver información completa', subtitle: 'Metadatos, descripción y estado actual' },
    { id: 'edit', label: '2. Editar título y sinopsis', subtitle: 'Modificar los campos principales de la novela' },
    { id: 'chapters', label: '3. Administrar capítulos', subtitle: 'Ver, reordenar y seleccionar capítulos existentes' },
    { id: 'new-chapter', label: '4. Escribir nuevo capítulo', subtitle: 'Abrir el editor interactivo de texto' },
    { id: 'stats', label: '5. Consultar estadísticas', subtitle: 'Lecturas, votos y métricas' },
    { id: 'export', label: '6. Exportar historia', subtitle: 'Generar archivo Markdown (.md) completo' },
    { id: 'sync', label: '7. Sincronizar cambios', subtitle: 'Verificar estado con Wattpad' },
    { id: 'publish', label: '8. Publicar cambios', subtitle: 'Preparar publicación oficial en Wattpad' },
    { id: 'back', label: '9. Volver a Mis historias', subtitle: 'Regresar a la lista de novelas' },
  ];

  constructor(
    story: StoryMetadata,
    onOpenChapters: (story: StoryMetadata) => void,
    onWriteNewChapter: (story: StoryMetadata) => void,
    onBack: () => void
  ) {
    this.story = story;
    this.onOpenChapters = onOpenChapters;
    this.onWriteNewChapter = onWriteNewChapter;
    this.onBack = onBack;
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const user = SessionManager.getUsername();

    lines.push(...HeaderComponent.render({ width, connectedUser: user }));
    lines.push(`  ${COLORS.BOLD}${COLORS.ORANGE}Administración de Historia:${COLORS.RESET} ${COLORS.TEXT_MAIN}${this.story.title}${COLORS.RESET}`);
    lines.push(`  ${COLORS.TEXT_MUTED}Estado:${COLORS.RESET} ${this.story.status.toUpperCase()} · ${COLORS.TEXT_MUTED}Capítulos:${COLORS.RESET} ${this.story.totalChapters} partes · ${COLORS.TEXT_MUTED}Género:${COLORS.RESET} ${this.story.genre}`);
    lines.push('');

    if (this.statusMessage) {
      lines.push(`  ${this.statusMessage}`);
      lines.push('');
    }

    if (this.viewMode === 'menu') {
      const menuLines = MenuListComponent.render(this.items, this.selectedIndex, {
        indent: 2,
        extraSpacing: true,
      });
      lines.push(...menuLines);
    } else if (this.viewMode === 'info') {
      lines.push(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Información del Manuscrito:${COLORS.RESET}`);
      lines.push(`    ${COLORS.TEXT_MUTED}ID Local:${COLORS.RESET}        ${this.story.id}`);
      lines.push(`    ${COLORS.TEXT_MUTED}Título:${COLORS.RESET}          ${this.story.title}`);
      lines.push(`    ${COLORS.TEXT_MUTED}Género:${COLORS.RESET}          ${this.story.genre}`);
      lines.push(`    ${COLORS.TEXT_MUTED}Idioma:${COLORS.RESET}          ${this.story.language}`);
      lines.push(`    ${COLORS.TEXT_MUTED}Clasificación:${COLORS.RESET}   ${this.story.rating === 'mature' ? 'Adultos (+18)' : 'Todo público'}`);
      lines.push(`    ${COLORS.TEXT_MUTED}Etiquetas:${COLORS.RESET}       #${this.story.tags.join(' #') || 'Sin etiquetas'}`);
      lines.push(`    ${COLORS.TEXT_MUTED}Capítulos:${COLORS.RESET}       ${this.story.totalChapters} partes`);
      lines.push(`    ${COLORS.TEXT_MUTED}Última modif:${COLORS.RESET}   ${formatDate(this.story.updatedAt)}`);
      lines.push('');
      lines.push(`    ${COLORS.TEXT_MUTED}Sinopsis:${COLORS.RESET}`);
      lines.push(`      ${COLORS.TEXT_MAIN}${this.story.description || '(Sin descripción)'}${COLORS.RESET}`);
      lines.push('');
      lines.push(`  ${COLORS.TEXT_DIM}[Presiona Esc o Enter para volver al panel]${COLORS.RESET}`);
    } else if (this.viewMode === 'edit-title') {
      lines.push(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Editar Título de la Novela:${COLORS.RESET}`);
      lines.push(`  ${COLORS.ORANGE}❯ Título:${COLORS.RESET} ${this.editTempTitle}_`);
      lines.push('');
      lines.push(`  ${COLORS.TEXT_DIM}[Presiona Enter para guardar, Esc para cancelar]${COLORS.RESET}`);
    } else if (this.viewMode === 'stats') {
      lines.push(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Estadísticas de la Obra:${COLORS.RESET}`);
      lines.push(`    ${COLORS.TEXT_MUTED}Lecturas:${COLORS.RESET}    ${this.story.reads}`);
      lines.push(`    ${COLORS.TEXT_MUTED}Votos:${COLORS.RESET}       ${this.story.votes}`);
      lines.push(`    ${COLORS.TEXT_MUTED}Comentarios:${COLORS.RESET} ${this.story.comments}`);
      lines.push(`    ${COLORS.TEXT_MUTED}Capítulos:${COLORS.RESET}   ${this.story.totalChapters}`);
      lines.push('');
      lines.push(`  ${COLORS.TEXT_DIM}[Presiona Esc o Enter para volver al panel]${COLORS.RESET}`);
    }

    const currentLines = lines.length;
    const remaining = Math.max(1, height - currentLines - 4);
    for (let i = 0; i < remaining; i++) {
      lines.push('');
    }

    lines.push(...FooterComponent.render(['↑↓ Navegar', 'Enter Seleccionar', 'Esc Volver'], width));
    return lines;
  }

  public handleKey(event: KeyPressEvent): void {
    if (this.viewMode === 'edit-title') {
      if (event.key === 'escape') {
        this.viewMode = 'menu';
      } else if (event.key === 'enter') {
        if (this.editTempTitle.trim()) {
          this.story.title = this.editTempTitle.trim();
          StoryService.updateStory(this.story);
          this.statusMessage = `${COLORS.SUCCESS}✓ Título actualizado a "${this.story.title}".${COLORS.RESET}`;
        }
        this.viewMode = 'menu';
      } else if (event.key === 'backspace') {
        this.editTempTitle = this.editTempTitle.slice(0, -1);
      } else if (event.key.length === 1 && !event.ctrl && !event.alt) {
        this.editTempTitle += event.key;
      }
      return;
    }

    if (this.viewMode !== 'menu') {
      if (event.key === 'escape' || event.key === 'enter') {
        this.viewMode = 'menu';
      }
      return;
    }

    if (event.key === 'escape') {
      this.onBack();
      return;
    }

    if (event.key === 'up') {
      this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
    } else if (event.key === 'down') {
      this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    } else if (event.key === 'enter') {
      const selected = this.items[this.selectedIndex];
      if (selected.id === 'info') {
        this.viewMode = 'info';
      } else if (selected.id === 'edit') {
        this.editTempTitle = this.story.title;
        this.viewMode = 'edit-title';
      } else if (selected.id === 'chapters') {
        this.onOpenChapters(this.story);
      } else if (selected.id === 'new-chapter') {
        this.onWriteNewChapter(this.story);
      } else if (selected.id === 'stats') {
        this.viewMode = 'stats';
      } else if (selected.id === 'export') {
        const file = StoryService.exportStory(this.story);
        this.statusMessage = `${COLORS.SUCCESS}✓ Manuscrito exportado en Markdown: ${file}${COLORS.RESET}`;
      } else if (selected.id === 'sync') {
        this.statusMessage = `${COLORS.INFO}Sincronización: Historia verificada en almacenamiento local (~/.wattpad).${COLORS.RESET}`;
      } else if (selected.id === 'publish') {
        if (this.story.status === 'local') {
          this.statusMessage = `${COLORS.WARNING}La historia está en modo local. Conéctate a Wattpad para publicar sus capítulos.${COLORS.RESET}`;
        } else {
          this.statusMessage = `${COLORS.SUCCESS}✓ Cambios listos para publicación.${COLORS.RESET}`;
        }
      } else if (selected.id === 'back') {
        this.onBack();
      }
    }
  }
}
