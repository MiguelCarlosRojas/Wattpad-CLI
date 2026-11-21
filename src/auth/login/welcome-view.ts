import { ViewInterface, KeyPressEvent, MenuItem } from '../../shared/types/navigation.types';
import { HeaderComponent } from '../../platform/terminal/components/header';
import { FooterComponent } from '../../platform/terminal/components/footer';
import { MenuListComponent } from '../../platform/terminal/components/menu-list';
import { COLORS } from '../../shared/constants/colors.constants';

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

    // Encabezado oficial no autenticado (mantiene su diseño original)
    lines.push(...HeaderComponent.render({ width }));

    // Título y descripción con margen izquierdo uniforme de 2 espacios (sin centrado horizontal)
    lines.push(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Bienvenido a Wattpad CLI${COLORS.RESET}`);
    lines.push('');
    lines.push(`  ${COLORS.TEXT_MUTED}Escribe, descubre y administra tus historias.${COLORS.RESET}`);
    lines.push('');

    // Menú interactivo alineado a la izquierda con sangría consistente y cursor en la misma columna
    const menuLines = MenuListComponent.render(this.items, this.selectedIndex, {
      indent: 2,
      extraSpacing: true,
    });
    lines.push(...menuLines);

    // Relleno proporcional dinámico para situar el pie en la parte inferior
    const currentLines = lines.length;
    const remaining = Math.max(1, height - currentLines - 4);
    for (let i = 0; i < remaining; i++) {
      lines.push('');
    }

    // Pie con navegación
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
