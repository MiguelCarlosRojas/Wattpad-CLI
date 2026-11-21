import readline from 'readline';
import { InteractiveView } from './interactive-view.interface';
import { Story, RemoteWattpadStory, LocalManuscript } from '../../../features/stories/types/story.types';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface CatalogViewProps {
  publishedStories: (Story | RemoteWattpadStory)[];
  draftStories: (Story | RemoteWattpadStory)[];
  localManuscripts: LocalManuscript[];
  onAction?: (actionId: string, item: any) => Promise<void> | void;
}

export class InteractiveCatalogView implements InteractiveView {
  private activeTab: 'published' | 'drafts' | 'local' = 'published';
  private selectedIndex: number = 0;
  private contextMenuOpen: boolean = false;
  private contextMenuIndex: number = 0;

  private contextActions = [
    { id: 'open', label: '1. Abrir novela' },
    { id: 'chapters', label: '2. Ver capítulos' },
    { id: 'create_chapter', label: '3. Crear capítulo' },
    { id: 'edit_info', label: '4. Editar información' },
    { id: 'publish', label: '5. Publicar cambios' },
    { id: 'sync', label: '6. Sincronizar' },
    { id: 'stats', label: '7. Consultar estadísticas' },
    { id: 'export', label: '8. Exportar novela' },
    { id: 'delete', label: '9. Eliminar novela' },
  ];

  constructor(private props: CatalogViewProps) {}

  public getId(): string {
    return 'stories-catalog';
  }

  public getTitle(): string {
    return 'CATÁLOGO DE NOVELAS';
  }

  public getBreadcrumbs(): string[] {
    return ['Wattpad CLI', 'Novelas'];
  }

  public getStatusBarHint(): string {
    if (this.contextMenuOpen) {
      return '↑/↓ Elegir acción  ·  Enter Confirmar  ·  Esc Volver al catálogo';
    }
    return '←/→ Cambiar pestaña  ·  ↑/↓ Seleccionar novela  ·  Enter Menú contextual  ·  Esc Volver';
  }

  private getCurrentList(): any[] {
    if (this.activeTab === 'published') return this.props.publishedStories;
    if (this.activeTab === 'drafts') return this.props.draftStories;
    return this.props.localManuscripts;
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const w = Math.max(50, width);
    const innerW = w - 4;
    const currentList = this.getCurrentList();

    if (this.selectedIndex >= currentList.length) {
      this.selectedIndex = Math.max(0, currentList.length - 1);
    }

    // Cabecera del Catálogo
    const topBar =
      Chalk.hex(Theme.colors.surfaceBorder, '╭─ ') +
      Chalk.bold(Chalk.hex(Theme.colors.primary, 'CATÁLOGO UNIFICADO DE OBRAS')) +
      Chalk.hex(Theme.colors.surfaceBorder, ` ${'─'.repeat(Math.max(2, w - 31))}╮`);
    lines.push(topBar);

    // Pestañas superiores: 1. Publicadas | 2. Borradores | 3. Manuscritos locales
    const pBadge = `Publicadas (${this.props.publishedStories.length})`;
    const dBadge = `Borradores (${this.props.draftStories.length})`;
    const mBadge = `Manuscritos Locales (${this.props.localManuscripts.length})`;

    const tab1 = this.activeTab === 'published' ? Chalk.bold(Chalk.hex(Theme.colors.primary, `[ ${pBadge} ]`)) : Chalk.dim(`  ${pBadge}  `);
    const tab2 = this.activeTab === 'drafts' ? Chalk.bold(Chalk.hex(Theme.colors.warning, `[ ${dBadge} ]`)) : Chalk.dim(`  ${dBadge}  `);
    const tab3 = this.activeTab === 'local' ? Chalk.bold(Chalk.hex(Theme.colors.info, `[ ${mBadge} ]`)) : Chalk.dim(`  ${mBadge}  `);

    lines.push(
      Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
      padEndVisible(`${tab1}  ${tab2}  ${tab3}`, innerW) +
      Chalk.hex(Theme.colors.surfaceBorder, ' │')
    );
    lines.push(Chalk.hex(Theme.colors.surfaceBorder, `├${'─'.repeat(w - 2)}┤`));

    // Menú contextual emergente sobre la obra seleccionada
    if (this.contextMenuOpen) {
      const selectedItem = currentList[this.selectedIndex];
      const itemTitle = selectedItem?.title || selectedItem?.fileName || 'Novela';
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.warning, `  OPCIONES PARA: ${itemTitle}`)), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim('  Selecciona una acción con ↑/↓ y pulsa Enter:'), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible('', innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );

      this.contextActions.forEach((act, idx) => {
        const isActSelected = idx === this.contextMenuIndex;
        const marker = isActSelected ? Chalk.bold(Chalk.hex(Theme.colors.primary, ' › ')) : '   ';
        const labelStr = isActSelected
          ? Chalk.bold(Chalk.hex(Theme.colors.primary, act.label))
          : Chalk.hex(Theme.colors.text, act.label);
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(`${marker}${labelStr}`, innerW) +
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

    // Listado de Obras dentro de la pestaña activa
    const capacity = Math.max(4, height - 8);
    let startIdx = 0;
    if (this.selectedIndex >= capacity) {
      startIdx = this.selectedIndex - capacity + 1;
    }
    const visibleItems = currentList.slice(startIdx, startIdx + capacity);

    if (currentList.length === 0) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim('  No hay elementos en esta categoría.'), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    } else {
      visibleItems.forEach((it, relIdx) => {
        const absIdx = startIdx + relIdx;
        const isSelected = absIdx === this.selectedIndex;
        const marker = isSelected ? Chalk.bold(Chalk.hex(Theme.colors.primary, ' › ')) : '   ';

        const rawTitle = it.title || it.detectedTitle || it.fileName || 'Sin título';
        const title = rawTitle.slice(0, 26).padEnd(28);
        const caps = it.chaptersCount ?? it.numParts ?? it.chapterCount ?? (it.parts ? it.parts.length : 0);
        const pubStatus = it.published ? 'Publicada' : 'Borrador';
        const syncStatus = it.synced === false ? '2 cambios locales' : 'Sincronizada';
        const meta = `${caps} caps · ${pubStatus} · ${syncStatus}`;

        const titleStyled = isSelected ? Chalk.bold(Chalk.hex(Theme.colors.primary, title)) : Chalk.hex(Theme.colors.text, title);
        const metaStyled = isSelected ? Chalk.hex(Theme.colors.white, meta) : Chalk.dim(meta);

        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(`${marker}${titleStyled}${metaStyled}`, innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      });
    }

    while (lines.length < capacity + 4) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible('', innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    }

    // Panel de Información de la Obra seleccionada
    lines.push(Chalk.hex(Theme.colors.surfaceBorder, `├${'─'.repeat(w - 2)}┤`));
    const selectedItem = currentList[this.selectedIndex];
    if (selectedItem) {
      const itemTitle = selectedItem.title || selectedItem.detectedTitle || selectedItem.fileName || 'Novela';
      const itemGenre = selectedItem.genre || 'Ficción';
      const itemStatus = selectedItem.published ? 'Publicada' : (selectedItem.status || 'Borrador');
      const itemCaps = selectedItem.chaptersCount ?? selectedItem.numParts ?? selectedItem.chapterCount ?? '0';
      const updated = selectedItem.lastModified || (selectedItem.updatedAt ? new Date(selectedItem.updatedAt).toLocaleDateString() : 'Reciente');
      const syncStatus = selectedItem.synced === false ? 'Cambios pendientes' : 'Sincronizada';

      const infoLine1 = `Nombre: ${itemTitle} · Género: ${itemGenre} · Caps: ${itemCaps} · Estado: ${itemStatus}`;
      const infoLine2 = `Actualizado: ${updated} · Sincronización: ${syncStatus} · Enter: Panel de administración`;

      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.hex(Theme.colors.textSecondary, infoLine1), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.hex(Theme.colors.info, infoLine2), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    } else {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim('Selecciona una novela con las flechas.'), innerW) +
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
    const currentList = this.getCurrentList();

    if (key.name === 'escape') {
      if (this.contextMenuOpen) {
        this.contextMenuOpen = false;
        return true;
      }
      return 'pop';
    }

    if (this.contextMenuOpen) {
      if (key.name === 'up') {
        this.contextMenuIndex = Math.max(0, this.contextMenuIndex - 1);
        return true;
      }
      if (key.name === 'down') {
        this.contextMenuIndex = Math.min(this.contextActions.length - 1, this.contextMenuIndex + 1);
        return true;
      }
      if (key.name === 'return') {
        const action = this.contextActions[this.contextMenuIndex];
        const item = currentList[this.selectedIndex];
        this.contextMenuOpen = false;
        if (this.props.onAction && action && item) {
          this.props.onAction(action.id, item);
        }
        return 'pop';
      }
      return true;
    }

    // Cambiar de pestaña con ← y →
    if (key.name === 'left') {
      if (this.activeTab === 'local') this.activeTab = 'drafts';
      else if (this.activeTab === 'drafts') this.activeTab = 'published';
      else this.activeTab = 'local';
      this.selectedIndex = 0;
      return true;
    }
    if (key.name === 'right') {
      if (this.activeTab === 'published') this.activeTab = 'drafts';
      else if (this.activeTab === 'drafts') this.activeTab = 'local';
      else this.activeTab = 'published';
      this.selectedIndex = 0;
      return true;
    }

    // Navegar novelas con ↑ y ↓
    if (key.name === 'up') {
      if (this.selectedIndex > 0) {
        this.selectedIndex--;
      }
      return true;
    }
    if (key.name === 'down') {
      if (this.selectedIndex < currentList.length - 1) {
        this.selectedIndex++;
      }
      return true;
    }

    // Abrir menú contextual con Enter
    if (key.name === 'return') {
      if (currentList.length > 0) {
        this.contextMenuOpen = true;
        this.contextMenuIndex = 0;
      }
      return true;
    }

    return true;
  }
}
