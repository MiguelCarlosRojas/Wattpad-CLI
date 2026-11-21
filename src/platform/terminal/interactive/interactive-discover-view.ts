import readline from 'readline';
import { InteractiveView } from './interactive-view.interface';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface DiscoverStoryCard {
  id: string;
  title: string;
  author: string;
  description?: string;
  reads?: string;
  votes?: string;
  parts?: number;
  tags?: string[];
  url?: string;
}

export interface DiscoverViewProps {
  initialQuery?: string;
  results?: DiscoverStoryCard[];
  onAction?: (actionId: string, item: DiscoverStoryCard) => Promise<void> | void;
}

export class InteractiveDiscoverView implements InteractiveView {
  private searchQuery: string = '';
  private filterCategory: 'genero' | 'estado' | 'idioma' = 'genero';
  private filterValues = {
    genero: ['Todos', 'Fantasía', 'Romance', 'Ciencia Ficción', 'Misterio'],
    estado: ['Todos', 'Completa', 'En Curso'],
    idioma: ['Español', 'English', 'Todos'],
  };
  private filterIndexes = {
    genero: 0,
    estado: 0,
    idioma: 0,
  };
  private selectedIndex: number = 0;
  private cardMenuOpen: boolean = false;
  private cardMenuIndex: number = 0;
  private results: DiscoverStoryCard[] = [];

  private cardActions = [
    { id: 'info', label: '1. Leer información completa' },
    { id: 'library', label: '2. Agregar a mi biblioteca' },
    { id: 'browser', label: '3. Abrir en navegador de Wattpad' },
  ];

  constructor(props: DiscoverViewProps) {
    this.searchQuery = props.initialQuery || '';
    this.results = props.results || [
      {
        id: 'W-001',
        title: 'El Susurro de las Sombras',
        author: 'ElenaG_Oficial',
        description: 'En un reino dividido por la magia ancestral, dos almas descubrirán el misterio oculto.',
        reads: '45.2K',
        votes: '3.8K',
        parts: 24,
        tags: ['fantasía', 'magia', 'aventura'],
        url: 'https://www.wattpad.com/story/1001',
      },
      {
        id: 'W-002',
        title: 'Cicatrices de Acero',
        author: 'CarlosM_Autor',
        description: 'La rebelión de los autómatas amenaza el último bastión de la humanidad.',
        reads: '128.5K',
        votes: '14.1K',
        parts: 36,
        tags: ['scifi', 'cyberpunk', 'accion'],
        url: 'https://www.wattpad.com/story/1002',
      },
      {
        id: 'W-003',
        title: 'Bajo el Cielo de París',
        author: 'LuciaValiente',
        description: 'Un encuentro inesperado en la ciudad del amor cambiará sus vidas para siempre.',
        reads: '89.0K',
        votes: '9.2K',
        parts: 18,
        tags: ['romance', 'paris', 'drama'],
        url: 'https://www.wattpad.com/story/1003',
      },
    ];
  }

  public getId(): string {
    return 'discover-search-view';
  }

  public getTitle(): string {
    return 'DESCUBRIR EN WATTPAD';
  }

  public getBreadcrumbs(): string[] {
    return ['Wattpad CLI', 'Descubrir'];
  }

  public getStatusBarHint(): string {
    if (this.cardMenuOpen) {
      return '↑/↓ Elegir acción  ·  Enter Confirmar  ·  Esc Volver a resultados';
    }
    return 'Escribe para buscar  ·  Tab Filtro  ·  ←/→ Cambiar filtro  ·  ↑/↓ Seleccionar  ·  Enter Menú  ·  Esc Salir';
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const w = Math.max(50, width);
    const innerW = w - 4;

    const topBar =
      Chalk.hex(Theme.colors.surfaceBorder, '╭─ ') +
      Chalk.bold(Chalk.hex(Theme.colors.primary, 'DESCUBRIR Y BUSCADOR OFICIAL DE WATTPAD')) +
      Chalk.hex(Theme.colors.surfaceBorder, ` ${'─'.repeat(Math.max(2, w - 42))}╮`);
    lines.push(topBar);

    // Barra de Búsqueda
    const searchVal = this.searchQuery || Chalk.dim('Escribe palabras clave o títulos...');
    lines.push(
      Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
      padEndVisible(Chalk.hex(Theme.colors.primary, 'Buscar en Wattpad: ') + Chalk.hex(Theme.colors.text, searchVal), innerW) +
      Chalk.hex(Theme.colors.surfaceBorder, ' │')
    );

    // Filtros interactivos con ← y →
    const curGenre = this.filterValues.genero[this.filterIndexes.genero];
    const curStatus = this.filterValues.estado[this.filterIndexes.estado];
    const curLang = this.filterValues.idioma[this.filterIndexes.idioma];

    const f1 = this.filterCategory === 'genero' ? Chalk.bold(Chalk.hex(Theme.colors.primary, `[ Género: ‹ ${curGenre} › ]`)) : Chalk.dim(`  Género: ${curGenre}  `);
    const f2 = this.filterCategory === 'estado' ? Chalk.bold(Chalk.hex(Theme.colors.warning, `[ Estado: ‹ ${curStatus} › ]`)) : Chalk.dim(`  Estado: ${curStatus}  `);
    const f3 = this.filterCategory === 'idioma' ? Chalk.bold(Chalk.hex(Theme.colors.info, `[ Idioma: ‹ ${curLang} › ]`)) : Chalk.dim(`  Idioma: ${curLang}  `);

    lines.push(
      Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
      padEndVisible(`${f1}  ${f2}  ${f3}`, innerW) +
      Chalk.hex(Theme.colors.surfaceBorder, ' │')
    );
    lines.push(Chalk.hex(Theme.colors.surfaceBorder, `├${'─'.repeat(w - 2)}┤`));

    // Menú de acciones en tarjeta
    if (this.cardMenuOpen) {
      const card = this.results[this.selectedIndex];
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.warning, `  OPCIONES: ${card?.title || 'Novela'}`)), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      this.cardActions.forEach((act, idx) => {
        const isSel = idx === this.cardMenuIndex;
        const marker = isSel ? Chalk.bold(Chalk.hex(Theme.colors.primary, ' › ')) : '   ';
        const label = isSel ? Chalk.bold(Chalk.hex(Theme.colors.primary, act.label)) : Chalk.hex(Theme.colors.text, act.label);
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(`${marker}${label}`, innerW) +
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

    // Listado de Tarjetas de Obras
    this.results.forEach((card, idx) => {
      const isSel = idx === this.selectedIndex;
      const marker = isSel ? Chalk.bold(Chalk.hex(Theme.colors.primary, ' › ')) : '   ';
      const title = isSel ? Chalk.bold(Chalk.hex(Theme.colors.primary, card.title)) : Chalk.hex(Theme.colors.text, card.title);
      const author = Chalk.dim(` por @${card.author}`);
      const stats = Chalk.hex(Theme.colors.muted, ` [👁 ${card.reads || '0'} | ★ ${card.votes || '0'} | 📖 ${card.parts || 0} partes]`);

      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(`${marker}${title}${author}${stats}`, innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );

      if (isSel && card.description) {
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.dim(`     "${card.description}"`), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      }
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

  public handleKeyPress(str: string, key: readline.Key): boolean | 'pop' {
    if (key.name === 'escape') {
      if (this.cardMenuOpen) {
        this.cardMenuOpen = false;
        return true;
      }
      return 'pop';
    }

    if (this.cardMenuOpen) {
      if (key.name === 'up') {
        this.cardMenuIndex = Math.max(0, this.cardMenuIndex - 1);
        return true;
      }
      if (key.name === 'down') {
        this.cardMenuIndex = Math.min(this.cardActions.length - 1, this.cardMenuIndex + 1);
        return true;
      }
      if (key.name === 'return') {
        this.cardMenuOpen = false;
        return true;
      }
      return true;
    }

    // Tab cambia categoría de filtro
    if (key.name === 'tab') {
      if (this.filterCategory === 'genero') this.filterCategory = 'estado';
      else if (this.filterCategory === 'estado') this.filterCategory = 'idioma';
      else this.filterCategory = 'genero';
      return true;
    }

    // ← y → cambian valor del filtro activo
    if (key.name === 'left') {
      const opts = this.filterValues[this.filterCategory];
      const cur = this.filterIndexes[this.filterCategory];
      this.filterIndexes[this.filterCategory] = (cur - 1 + opts.length) % opts.length;
      return true;
    }
    if (key.name === 'right') {
      const opts = this.filterValues[this.filterCategory];
      const cur = this.filterIndexes[this.filterCategory];
      this.filterIndexes[this.filterCategory] = (cur + 1) % opts.length;
      return true;
    }

    // Navegar tarjetas con ↑ y ↓
    if (key.name === 'up') {
      if (this.selectedIndex > 0) this.selectedIndex--;
      return true;
    }
    if (key.name === 'down') {
      if (this.selectedIndex < this.results.length - 1) this.selectedIndex++;
      return true;
    }

    if (key.name === 'return') {
      if (this.results.length > 0) {
        this.cardMenuOpen = true;
        this.cardMenuIndex = 0;
      }
      return true;
    }

    // Escribir en la barra de búsqueda
    if (key.name === 'backspace') {
      this.searchQuery = this.searchQuery.slice(0, -1);
      return true;
    }
    if (str && !key.ctrl && !key.meta && str.length === 1 && !['\r', '\n', '\t'].includes(str)) {
      this.searchQuery += str;
      return true;
    }

    return true;
  }
}
