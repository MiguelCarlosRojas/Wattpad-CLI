import readline from 'readline';
import { InteractiveView } from './interactive-view.interface';
import { SettingsManager, SettingDefinition, SETTINGS_DEFINITIONS } from '../../../core/config/settings-manager';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';
import { ThemeManager } from '../theme-manager';
import { TerminalAdapter } from '../terminal-adapter';

export class InteractiveSettingsView implements InteractiveView {
  private searchQuery: string = '';
  private selectedIndex: number = 0;
  private isEditingText: boolean = false;
  private editBuffer: string = '';
  private popupOpen: boolean = false;
  private popupSelectedIndex: number = 0;

  constructor(
    private settingsManager: SettingsManager,
    private onModeChange?: (mode: 'completa' | 'compacta' | 'zen') => void
  ) {}

  public getId(): string {
    return 'settings-config';
  }

  public getTitle(): string {
    return 'PANEL DE CONFIGURACIÓN';
  }

  public getBreadcrumbs(): string[] {
    return ['Wattpad CLI', 'Configuración'];
  }

  public getStatusBarHint(): string {
    if (this.popupOpen) {
      return '↑/↓ Seleccionar opción  ·  Enter Confirmar  ·  Esc Cancelar';
    }
    if (this.isEditingText) {
      return 'Escribe el nuevo valor  ·  Enter Guardar  ·  Esc Cancelar';
    }
    return '↑/↓ Navegar  ·  ←/→ Cambiar valor  ·  Enter Elegir/Editar  ·  Escribe para buscar  ·  Esc Salir';
  }

  public getFilteredDefinitions(): SettingDefinition[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return SETTINGS_DEFINITIONS;
    return SETTINGS_DEFINITIONS.filter((def) => {
      const matchKey = (def.id || '').toLowerCase().includes(q);
      const matchLabel = (def.name || '').toLowerCase().includes(q);
      const matchCat = (def.category || '').toLowerCase().includes(q);
      const matchDesc = (def.description || '').toLowerCase().includes(q);
      return matchKey || matchLabel || matchCat || matchDesc;
    });
  }

  private applyLiveEffect(id: string, value: string): void {
    if ((id === 'theme' || id === 'color_scheme') && typeof value === 'string') {
      try {
        let th = value.toLowerCase();
        if (th.includes('wattpad')) th = 'wattpad';
        else if (th.includes('light')) th = 'light';
        else if (th.includes('monokai')) th = 'monokai';
        else th = 'dark';
        ThemeManager.setTheme(th as any);
      } catch {}
    } else if (id === 'interface_mode' && this.onModeChange && typeof value === 'string') {
      try {
        const m = value === 'complete' ? 'completa' : (value === 'compact' ? 'compacta' : 'zen');
        this.onModeChange(m);
      } catch {}
    } else if (id === 'rendering_engine' && typeof value === 'string') {
      try {
        TerminalAdapter.setMode(value === 'inline' ? 'inline' : 'fullscreen');
      } catch {}
    }
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const w = Math.max(50, width);
    const innerW = w - 4;
    const filtered = this.getFilteredDefinitions();

    if (this.selectedIndex >= filtered.length) {
      this.selectedIndex = Math.max(0, filtered.length - 1);
    }

    // 1. Cabecera del Panel
    const topBar =
      Chalk.hex(Theme.colors.surfaceBorder, '╭─ ') +
      Chalk.bold(Chalk.hex(Theme.colors.primary, 'CONFIGURACIÓN DE WATTPAD CLI')) +
      Chalk.hex(Theme.colors.surfaceBorder, ` ${'─'.repeat(Math.max(2, w - 34))}╮`);
    lines.push(topBar);

    // 2. Buscador superior: Search: ________________
    const searchPrompt = 'Search: ';
    const searchVal = this.searchQuery.length > 0 ? this.searchQuery : Chalk.dim('Escribe aquí para filtrar opciones...');
    const searchLine = Chalk.hex(Theme.colors.primary, searchPrompt) + Chalk.hex(Theme.colors.text, searchVal);
    lines.push(
      Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
      padEndVisible(searchLine, innerW) +
      Chalk.hex(Theme.colors.surfaceBorder, ' │')
    );

    lines.push(Chalk.hex(Theme.colors.surfaceBorder, `├${'─'.repeat(w - 2)}┤`));

    // 3. Altura asignada para el listado vs la caja de descripción inferior
    const descBoxHeight = 5;
    const listCapacity = Math.max(4, height - descBoxHeight - 6);

    let startIdx = 0;
    if (this.selectedIndex >= listCapacity) {
      startIdx = this.selectedIndex - listCapacity + 1;
    }
    const visibleDefs = filtered.slice(startIdx, startIdx + listCapacity);

    if (filtered.length === 0) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim('  No se encontraron opciones que coincidan con la búsqueda.'), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      while (lines.length < listCapacity + 3) {
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible('', innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      }
    } else {
      visibleDefs.forEach((def, relIdx) => {
        const absIdx = startIdx + relIdx;
        const isSelected = absIdx === this.selectedIndex;
        const val = this.settingsManager.get(def.id);

        const categoryBadge = Chalk.hex(Theme.colors.muted, `[${def.category}]`);
        const marker = isSelected ? Chalk.bold(Chalk.hex(Theme.colors.primary, ' › ')) : '   ';

        let valFormatted = '';
        if (def.type === 'boolean') {
          const isOn = val === 'on' || val === 'true';
          valFormatted = isOn
            ? Chalk.bold(Chalk.hex(Theme.colors.success, 'on  (Activo)'))
            : Chalk.dim('off (Inactivo)');
        } else if (def.type === 'enum' || def.options) {
          valFormatted = Chalk.bold(Chalk.hex(Theme.colors.info, `‹ ${String(val)} ›`));
        } else {
          valFormatted = Chalk.hex(Theme.colors.text, String(val));
        }

        const labelPart = isSelected
          ? Chalk.bold(Chalk.hex(Theme.colors.primary, def.name))
          : Chalk.hex(Theme.colors.text, def.name);

        const leftSide = `${marker}${categoryBadge} ${labelPart}`;
        const leftLen = stripAnsi(leftSide).length;
        const rightLen = stripAnsi(valFormatted).length;
        const spacing = Math.max(2, innerW - leftLen - rightLen);

        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(`${leftSide}${' '.repeat(spacing)}${valFormatted}`, innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      });

      while (lines.length < startIdx + visibleDefs.length + 3 && lines.length < listCapacity + 3) {
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible('', innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      }
    }

    // 4. Separador antes de la Caja de Descripción
    lines.push(Chalk.hex(Theme.colors.surfaceBorder, `├${'─'.repeat(w - 2)}┤`));

    // 5. Caja de Descripción Inferior
    const selectedDef = filtered[this.selectedIndex];
    if (selectedDef) {
      const curVal = this.settingsManager.get(selectedDef.id);
      const desc1 = `Descripción: ${selectedDef.description.split('\n')[0]}`;
      const desc2 = `Valor actual: ${String(curVal)}    Tipo: ${selectedDef.type}`;
      const optionsStr = selectedDef.options ? `Opciones: ${selectedDef.options.join(' | ')}` : (selectedDef.type === 'boolean' ? 'Opciones: on | off' : 'Edición directa con Enter');
      const impactStr = 'Impacto: Inmediato en la sesión actual y guardado en JSON';

      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.hex(Theme.colors.textSecondary, desc1), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.hex(Theme.colors.info, desc2) + '  ·  ' + Chalk.dim(optionsStr), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.hex(Theme.colors.warning, impactStr), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    } else {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim('Selecciona una opción para ver su descripción e impacto.'), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible('', innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible('', innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    }

    // Modal emergente selector de opciones
    if (this.popupOpen && selectedDef && selectedDef.options) {
      lines.push(Chalk.hex(Theme.colors.surfaceBorder, `├${'─'.repeat(w - 2)}┤`));
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.warning, `  SELECCIONAR VALOR PARA: ${selectedDef.name}`)), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      selectedDef.options.forEach((opt, idx) => {
        const isOptSelected = idx === this.popupSelectedIndex;
        const optMarker = isOptSelected ? Chalk.bold(Chalk.hex(Theme.colors.primary, '   ● ')) : '     ○ ';
        const optText = isOptSelected ? Chalk.bold(Chalk.hex(Theme.colors.primary, opt)) : Chalk.hex(Theme.colors.text, opt);
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(`${optMarker}${optText}`, innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      });
    }

    // Modal de edición de texto/número
    if (this.isEditingText && selectedDef) {
      lines.push(Chalk.hex(Theme.colors.surfaceBorder, `├${'─'.repeat(w - 2)}┤`));
      const editPrompt = `  Nuevo valor para ${selectedDef.name}: [ ${this.editBuffer}_ ]  (Enter: Guardar, Esc: Cancelar)`;
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.warning, editPrompt)), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    }

    const bottomBar = Chalk.hex(Theme.colors.surfaceBorder, `╰${'─'.repeat(w - 2)}╯`);
    lines.push(bottomBar);

    return lines;
  }

  public handleKeyPress(str: string, key: readline.Key): boolean | 'pop' {
    const filtered = this.getFilteredDefinitions();
    const curDef = filtered[this.selectedIndex];

    if (this.isEditingText) {
      if (key.name === 'escape') {
        this.isEditingText = false;
        return true;
      }
      if (key.name === 'return') {
        if (curDef) {
          const finalVal = this.editBuffer.trim();
          this.settingsManager.set(curDef.id, finalVal);
          this.applyLiveEffect(curDef.id, finalVal);
        }
        this.isEditingText = false;
        return true;
      }
      if (key.name === 'backspace') {
        this.editBuffer = this.editBuffer.slice(0, -1);
        return true;
      }
      if (str && !key.ctrl && !key.meta) {
        this.editBuffer += str;
        return true;
      }
      return true;
    }

    if (this.popupOpen && curDef && curDef.options) {
      if (key.name === 'escape') {
        this.popupOpen = false;
        return true;
      }
      if (key.name === 'up') {
        this.popupSelectedIndex = Math.max(0, this.popupSelectedIndex - 1);
        return true;
      }
      if (key.name === 'down') {
        this.popupSelectedIndex = Math.min(curDef.options.length - 1, this.popupSelectedIndex + 1);
        return true;
      }
      if (key.name === 'return') {
        const chosen = curDef.options[this.popupSelectedIndex];
        if (chosen !== undefined) {
          this.settingsManager.set(curDef.id, chosen);
          this.applyLiveEffect(curDef.id, chosen);
        }
        this.popupOpen = false;
        return true;
      }
      return true;
    }

    if (key.name === 'escape') {
      if (this.searchQuery.length > 0) {
        this.searchQuery = '';
        this.selectedIndex = 0;
        return true;
      }
      return 'pop';
    }

    if (key.name === 'up') {
      if (this.selectedIndex > 0) {
        this.selectedIndex--;
      }
      return true;
    }
    if (key.name === 'down') {
      if (this.selectedIndex < filtered.length - 1) {
        this.selectedIndex++;
      }
      return true;
    }

    if (key.name === 'right') {
      if (curDef) {
        const newVal = this.settingsManager.cycleNext(curDef.id);
        this.applyLiveEffect(curDef.id, newVal);
      }
      return true;
    }
    if (key.name === 'left') {
      if (curDef) {
        const newVal = this.settingsManager.cyclePrev(curDef.id);
        this.applyLiveEffect(curDef.id, newVal);
      }
      return true;
    }

    if (key.name === 'return') {
      if (!curDef) return true;

      if (curDef.type === 'boolean') {
        const newVal = this.settingsManager.cycleNext(curDef.id);
        this.applyLiveEffect(curDef.id, newVal);
        return true;
      }

      if (curDef.options && curDef.options.length > 0) {
        this.popupOpen = true;
        const curVal = this.settingsManager.get(curDef.id);
        const curIdx = curDef.options.indexOf(String(curVal));
        this.popupSelectedIndex = curIdx >= 0 ? curIdx : 0;
        return true;
      }

      if (curDef.type === 'text' || curDef.type === 'number') {
        this.isEditingText = true;
        this.editBuffer = String(this.settingsManager.get(curDef.id) || '');
        return true;
      }

      if (curDef.type === 'action') {
        const val = this.settingsManager.cycleNext(curDef.id);
        this.applyLiveEffect(curDef.id, val);
        return true;
      }
    }

    if (key.name === 'backspace') {
      if (this.searchQuery.length > 0) {
        this.searchQuery = this.searchQuery.slice(0, -1);
        this.selectedIndex = 0;
      }
      return true;
    }

    if (str && !key.ctrl && !key.meta && str.length === 1 && !['\r', '\n', '\t'].includes(str)) {
      this.searchQuery += str;
      this.selectedIndex = 0;
      return true;
    }

    return true;
  }
}
