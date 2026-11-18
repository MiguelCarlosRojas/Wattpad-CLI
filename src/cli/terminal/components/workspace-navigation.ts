import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface NavItem {
  id: string;
  label: string;
  command: string;
  category: 'WORKSPACE' | 'INTELIGENCIA ARTIFICIAL' | 'INTEGRACIONES' | 'CUENTA';
}

export const NAV_ITEMS: NavItem[] = [
  // WORKSPACE
  { id: 'home', label: 'Inicio', command: '/clear', category: 'WORKSPACE' },
  { id: 'library', label: 'Biblioteca', command: '/library', category: 'WORKSPACE' },
  { id: 'stories', label: 'Novelas', command: '/stories', category: 'WORKSPACE' },
  { id: 'chapters', label: 'Capítulos', command: '/chapters', category: 'WORKSPACE' },

  // INTELIGENCIA ARTIFICIAL
  { id: 'assistant', label: 'Asistente IA', command: '/models', category: 'INTELIGENCIA ARTIFICIAL' },
  { id: 'models', label: 'Modelos', command: '/models', category: 'INTELIGENCIA ARTIFICIAL' },

  // INTEGRACIONES
  { id: 'word', label: 'Word (.docx)', command: '/connect word', category: 'INTEGRACIONES' },
  { id: 'notepad', label: 'Notepad (.txt)', command: '/connect notepad', category: 'INTEGRACIONES' },
  { id: 'google', label: 'Google Docs', command: '/connect google', category: 'INTEGRACIONES' },
  { id: 'sync', label: 'Sincronización', command: '/sync', category: 'INTEGRACIONES' },

  // CUENTA
  { id: 'profile', label: 'Perfil', command: '/profile', category: 'CUENTA' },
  { id: 'settings', label: 'Configuración', command: '/settings', category: 'CUENTA' },
  { id: 'help', label: 'Ayuda', command: '/help', category: 'CUENTA' },
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
    const categories: Array<'WORKSPACE' | 'INTELIGENCIA ARTIFICIAL' | 'INTEGRACIONES' | 'CUENTA'> = [
      'WORKSPACE',
      'INTELIGENCIA ARTIFICIAL',
      'INTEGRACIONES',
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
      }

      lines.push(''); // small spacer between categories
    }

    // Pad or trim to maxHeight
    while (lines.length < maxHeight) {
      lines.push(' '.repeat(width));
    }
    return lines.slice(0, maxHeight);
  }
}
