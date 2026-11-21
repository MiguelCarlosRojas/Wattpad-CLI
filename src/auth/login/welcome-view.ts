import { ViewInterface, KeyPressEvent, MenuItem } from '../../shared/types/navigation.types';
import { HeaderComponent } from '../../platform/terminal/components/header';
import { FooterComponent } from '../../platform/terminal/components/footer';
import { MenuListComponent } from '../../platform/terminal/components/menu-list';
import { COLORS } from '../../shared/constants/colors.constants';
import { padCenter } from '../../shared/utils/ansi';

export class WelcomeView implements ViewInterface {
  public id = 'welcome' as const;
  private selectedIndex = 0;
  private onSelectOption: (optionId: string) => void;

  private items: MenuItem[] = [
    { id: 'login', label: 'Iniciar sesión', subtitle: 'Accede con tu cuenta de Wattpad' },
    { id: 'register', label: 'Crear cuenta', subtitle: 'Regístrate en el entorno oficial de Wattpad' },
    { id: 'exit', label: 'Salir', subtitle: 'Cerrar la terminal de forma segura' },
  ];

  constructor(onSelectOption: (optionId: string) => void) {
    this.onSelectOption = onSelectOption;
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];

    // Encabezado oficial no autenticado
    lines.push(...HeaderComponent.render({ width }));

    // Título de bienvenida centrado
    lines.push(padCenter(`${COLORS.BOLD}${COLORS.TEXT_MAIN}Bienvenido a Wattpad CLI${COLORS.RESET}`, width));
    lines.push('');
    lines.push(padCenter(`${COLORS.TEXT_MUTED}Escribe, descubre y administra tus historias.${COLORS.RESET}`, width));
    lines.push('');
    lines.push('');

    // Menú de opciones
    const menuLines = MenuListComponent.render(this.items, this.selectedIndex, Math.max(8, Math.floor(width / 2) - 16));
    lines.push(...menuLines);

    // Relleno hasta el pie
    const currentLines = lines.length;
    const remaining = Math.max(1, height - currentLines - 4);
    for (let i = 0; i < remaining; i++) {
      lines.push('');
    }

    // Pie con atajos
    lines.push(...FooterComponent.render(['↑↓ Navegar', 'Enter Seleccionar', 'Esc Salir', 'Ctrl+C Salir'], width));

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
        this.onSelectOption(selected.id);
      }
    } else if (event.key === 'escape') {
      this.onSelectOption('exit');
    }
  }
}
