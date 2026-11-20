import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface SelectorItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  data?: any;
}

export interface SelectorProps {
  title: string;
  subtitle?: string;
  items: SelectorItem[];
  selectedIndex: number;
  activePanel?: 'list' | 'details';
  actionMenuOpen?: boolean;
  actionMenuIndex?: number;
  width: number;
  height?: number;
}

export const CHAPTER_ACTIONS = [
  { id: 'cli_edit', label: '1. Editar aquí en Wattpad CLI', desc: 'Editor multilínea integrado en la terminal' },
  { id: 'open_word', label: '2. Abrir con Microsoft Word', desc: 'Sincronizar y editar archivo .docx nativo' },
  { id: 'open_notepad', label: '3. Abrir con Bloc de Notas', desc: 'Sincronizar y editar archivo .txt simple' },
  { id: 'open_google', label: '4. Abrir con Google Docs', desc: 'Sincronizar con Google Docs en la nube' },
  { id: 'view_content', label: '5. Ver contenido', desc: 'Visualizar el texto formateado en la terminal' },
  { id: 'cancel', label: '6. Cancelar', desc: 'Cerrar este menú y volver al selector' },
];

export class ItemSelector {
  public static render(props: SelectorProps): string[] {
    const lines: string[] = [];
    const width = Math.max(50, props.width || 80);
    const innerWidth = width - 4;

    // Header del Selector
    const topBorder =
      Chalk.hex(Theme.colors.surfaceBorder, '╭─ ') +
      Chalk.bold(Chalk.hex(Theme.colors.primary, props.title || 'SELECTOR INTERACTIVO')) +
      Chalk.hex(Theme.colors.surfaceBorder, ` ${'─'.repeat(Math.max(2, width - (props.title?.length || 18) - 6))}╮`);
    lines.push(topBorder);

    if (props.subtitle) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim(props.subtitle), innerWidth) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    }

    const navHint = '↑/↓: Seleccionar   ←/→: Cambiar panel   Enter: Abrir menú   Esc: Cancelar';
    lines.push(
      Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
      padEndVisible(Chalk.hex(Theme.colors.info, navHint), innerWidth) +
      Chalk.hex(Theme.colors.surfaceBorder, ' │')
    );

    lines.push(Chalk.hex(Theme.colors.surfaceBorder, `├${'─'.repeat(width - 2)}┤`));

    // Si el menú de acciones está abierto sobre el elemento seleccionado
    if (props.actionMenuOpen) {
      const selectedItem = props.items[props.selectedIndex];
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.warning, `  OPCIONES PARA: ${selectedItem?.title || 'Capítulo'}`)), innerWidth) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.dim('  Selecciona una acción con ↑/↓ y pulsa Enter:'), innerWidth) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible('', innerWidth) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );

      CHAPTER_ACTIONS.forEach((act, idx) => {
        const isActSelected = idx === (props.actionMenuIndex || 0);
        const marker = isActSelected ? Chalk.bold(Chalk.hex(Theme.colors.primary, ' › ')) : '   ';
        const labelStr = isActSelected
          ? Chalk.bold(Chalk.hex(Theme.colors.primary, act.label))
          : Chalk.hex(Theme.colors.text, act.label);
        const descStr = Chalk.dim(` — ${act.desc}`);

        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(`${marker}${labelStr}${descStr}`, innerWidth) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      });
    } else {
      // Lista de elementos seleccionables con 4 flechas
      if (props.items.length === 0) {
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.dim('  (No hay elementos disponibles en esta sección)'), innerWidth) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      } else {
        props.items.forEach((item, idx) => {
          const isSelected = idx === props.selectedIndex;
          const marker = isSelected ? Chalk.bold(Chalk.hex(Theme.colors.primary, ' ❯ ')) : '   ';
          const title = isSelected
            ? Chalk.bold(Chalk.hex(Theme.colors.primary, item.title))
            : Chalk.hex(Theme.colors.text, item.title);

          let badgeStr = '';
          if (item.badge) {
            const color = item.badgeColor || Theme.colors.primary;
            badgeStr = `  ${Chalk.hex(color, `[${item.badge}]`)}`;
          }

          const lineContent = `${marker}${title}${badgeStr}`;
          lines.push(
            Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
            padEndVisible(lineContent, innerWidth) +
            Chalk.hex(Theme.colors.surfaceBorder, ' │')
          );

          if (item.subtitle) {
            const subMarker = '     ';
            lines.push(
              Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
              padEndVisible(`${subMarker}${Chalk.dim(item.subtitle)}`, innerWidth) +
              Chalk.hex(Theme.colors.surfaceBorder, ' │')
            );
          }
        });
      }
    }

    const bottomBorder = Chalk.hex(Theme.colors.surfaceBorder, `╰${'─'.repeat(width - 2)}╯`);
    lines.push(bottomBorder);

    return lines;
  }
}
