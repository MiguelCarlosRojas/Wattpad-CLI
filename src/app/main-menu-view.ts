import { ViewInterface, KeyPressEvent, MenuItem, ScreenId } from '../shared/types/navigation.types';
import { HeaderComponent } from '../platform/terminal/components/header';
import { FooterComponent } from '../platform/terminal/components/footer';
import { MenuListComponent } from '../platform/terminal/components/menu-list';
import { SessionManager } from '../auth/session/session-manager';
import { COLORS } from '../shared/constants/colors.constants';
import { divider } from '../shared/utils/ansi';

export class MainMenuView implements ViewInterface {
  public id = 'main-menu' as const;
  private selectedIndex = 0;
  private onNavigate: (screen: ScreenId) => void;

  // Las 5 opciones obligatorias en estricto orden
  private items: MenuItem[] = [
    { id: 'search', label: 'Buscar novelas', subtitle: 'Descubre y filtra historias disponibles en Wattpad' },
    { id: 'inbox', label: 'Buzón', subtitle: 'Mensajes, conversaciones y notificaciones' },
    { id: 'library', label: 'Biblioteca', subtitle: 'Tus historias guardadas en Wattpad' },
    { id: 'create-story', label: 'Crear historia', subtitle: 'Asistente para iniciar un nuevo manuscrito' },
    { id: 'my-stories', label: 'Mis historias', subtitle: 'Tus obras, borradores, capítulos y publicaciones' },
  ];

  constructor(onNavigate: (screen: ScreenId) => void) {
    this.onNavigate = onNavigate;
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const user = SessionManager.getUsername();

    // Encabezado oficial con usuario conectado
    lines.push(...HeaderComponent.render({ width, connectedUser: user }));

    // Título de la sección
    lines.push(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Menú principal${COLORS.RESET}`);
    lines.push('');

    // Lista de las 5 opciones
    const menuLines = MenuListComponent.render(this.items, this.selectedIndex, 2);
    lines.push(...menuLines);

    // Separador y prompt de entrada minimalista
    lines.push('');
    lines.push(divider(width));
    lines.push(`  ${COLORS.ORANGE}❯${COLORS.RESET} `);

    const currentLines = lines.length;
    const remaining = Math.max(1, height - currentLines - 4);
    for (let i = 0; i < remaining; i++) {
      lines.push('');
    }

    // Pie con navegación
    lines.push(...FooterComponent.render(['↑↓ Navegar', 'Enter Abrir', 'Ctrl+P Comandos', 'Ctrl+C Salir'], width));
    return lines;
  }

  public handleKey(event: KeyPressEvent): void {
    if (event.key === 'up') {
      this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
    } else if (event.key === 'down') {
      this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    } else if (event.key === 'enter') {
      const selected = this.items[this.selectedIndex];
      if (selected) {
        this.onNavigate(selected.id as ScreenId);
      }
    }
  }
}
