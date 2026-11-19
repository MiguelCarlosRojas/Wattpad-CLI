import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface NavItem {
  id: string;
  label: string;
  command: string;
  category: 'NOVELAS' | 'DOCUMENTOS' | 'PUBLICACIÓN' | 'CUENTA';
}

export const NAV_ITEMS: NavItem[] = [
  // NOVELAS
  { id: 'home', label: 'Inicio', command: '/clear', category: 'NOVELAS' },
  { id: 'stories', label: 'Mis novelas', command: '/stories', category: 'NOVELAS' },
  { id: 'new-story', label: 'Nueva novela', command: '/story new', category: 'NOVELAS' },
  { id: 'chapters', label: 'Mis capítulos', command: '/chapters', category: 'NOVELAS' },

  // DOCUMENTOS
  { id: 'documents', label: 'Árbol de documentos', command: '/documents', category: 'DOCUMENTOS' },
  { id: 'word', label: 'Microsoft Word (.docx)', command: '/connect word', category: 'DOCUMENTOS' },
  { id: 'notepad', label: 'Notepad (.txt)', command: '/connect notepad', category: 'DOCUMENTOS' },
  { id: 'google', label: 'Google Docs', command: '/connect google', category: 'DOCUMENTOS' },

  // PUBLICACIÓN
  { id: 'publish-status', label: 'Estado de publicación', command: '/publish status', category: 'PUBLICACIÓN' },
  { id: 'publish', label: 'Publicar novela / cap', command: '/publish', category: 'PUBLICACIÓN' },
  { id: 'sync', label: 'Sincronizar cloud', command: '/sync', category: 'PUBLICACIÓN' },

  // CUENTA
  { id: 'account', label: 'Estado de cuenta', command: '/account', category: 'CUENTA' },
  { id: 'login', label: 'Conectar Wattpad', command: '/login', category: 'CUENTA' },
  { id: 'register', label: 'Registrarse en Wattpad', command: '/register', category: 'CUENTA' },
  { id: 'logout', label: 'Cerrar sesión', command: '/logout', category: 'CUENTA' },
  { id: 'help', label: 'Ayuda de comandos', command: '/help', category: 'CUENTA' },
];

export class WorkspaceNavigation {
  private selectedIndex: number = 0;

  constructor(initialId: string = 'home') {
    const idx = NAV_ITEMS.findIndex((item) => item.id === initialId);
    if (idx !== -1) {
      this.selectedIndex = idx;
    }
  }

  public getSelectedItem(): NavItem {
    return NAV_ITEMS[this.selectedIndex] || NAV_ITEMS[0];
  }

  public getSelectedIndex(): number {
    return this.selectedIndex;
  }

  public selectById(id: string): void {
    const idx = NAV_ITEMS.findIndex((item) => item.id === id);
    if (idx !== -1) {
      this.selectedIndex = idx;
    }
  }

  public navigateUp(): void {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
    }
  }

  public navigateDown(): void {
    if (this.selectedIndex < NAV_ITEMS.length - 1) {
      this.selectedIndex++;
    }
  }

  public render(width: number, maxHeight: number, isFocused: boolean = false): string[] {
    const lines: string[] = [];
    const categories: Array<'NOVELAS' | 'DOCUMENTOS' | 'PUBLICACIÓN' | 'CUENTA'> = [
      'NOVELAS',
      'DOCUMENTOS',
      'PUBLICACIÓN',
      'CUENTA',
    ];

    for (const cat of categories) {
      const itemsInCat = NAV_ITEMS.filter((i) => i.category === cat);
      if (itemsInCat.length === 0) continue;

      // Category Header
      lines.push(Chalk.dim(Chalk.bold(cat)));

      for (const item of itemsInCat) {
        const isSelected = NAV_ITEMS[this.selectedIndex].id === item.id;
        let line: string;

        if (isSelected) {
          const indicator = Chalk.hex(Theme.colors.primary, '›');
          const text = isFocused
            ? Chalk.bold(Chalk.hex(Theme.colors.white, item.label))
            : Chalk.hex(Theme.colors.primary, item.label);
          line = ` ${indicator} ${text}`;
        } else {
          line = `   ${Chalk.hex(Theme.colors.textSecondary, item.label)}`;
        }

        lines.push(padEndVisible(line, width));
        if (lines.length >= maxHeight) break;
      }

      lines.push('');
      if (lines.length >= maxHeight) break;
    }

    while (lines.length < maxHeight) {
      lines.push(' '.repeat(width));
    }

    return lines.slice(0, maxHeight);
  }
}
