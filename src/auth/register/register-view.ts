import { ViewInterface, KeyPressEvent, MenuItem } from '../../shared/types/navigation.types';
import { HeaderComponent } from '../../platform/terminal/components/header';
import { FooterComponent } from '../../platform/terminal/components/footer';
import { MenuListComponent } from '../../platform/terminal/components/menu-list';
import { AuthService } from '../auth-service';
import { COLORS } from '../../shared/constants/colors.constants';

export class RegisterView implements ViewInterface {
  public id = 'register' as const;
  private selectedIndex = 0;
  private statusMessage = '';
  private isLoading = false;

  private onRegisterSuccess: () => void;
  private onBack: () => void;

  private items: MenuItem[] = [
    { id: 'start-register', label: 'Abrir registro oficial de Wattpad', subtitle: 'Abre el navegador para crear una nueva cuenta' },
    { id: 'back', label: 'Volver', subtitle: 'Regresar a la pantalla de bienvenida' },
  ];

  constructor(onRegisterSuccess: () => void, onBack: () => void) {
    this.onRegisterSuccess = onRegisterSuccess;
    this.onBack = onBack;
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];

    lines.push(...HeaderComponent.render({ width }));

    lines.push(`  ${COLORS.BOLD}${COLORS.TEXT_MAIN}Crear cuenta en Wattpad${COLORS.RESET}`);
    lines.push('');
    lines.push(`  ${COLORS.TEXT_MUTED}El registro se completa de forma oficial y segura en Wattpad.${COLORS.RESET}`);
    lines.push('');

    if (this.isLoading) {
      lines.push(`  ${COLORS.ORANGE}⏳ Abriendo registro oficial en el navegador... Completa el proceso allí.${COLORS.RESET}`);
      lines.push('');
    } else if (this.statusMessage) {
      lines.push(`  ${this.statusMessage}`);
      lines.push('');
    }

    const menuLines = MenuListComponent.render(this.items, this.selectedIndex, {
      indent: 2,
      extraSpacing: true,
    });
    lines.push(...menuLines);

    const currentLines = lines.length;
    const remaining = Math.max(1, height - currentLines - 4);
    for (let i = 0; i < remaining; i++) {
      lines.push('');
    }

    lines.push(...FooterComponent.render(['↑↓ Navegar', 'Enter Iniciar', 'Esc Volver', 'Ctrl+C Salir'], width));
    return lines;
  }

  public async handleKey(event: KeyPressEvent): Promise<void> {
    if (this.isLoading) return;

    if (event.key === 'up') {
      this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
    } else if (event.key === 'down') {
      this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    } else if (event.key === 'escape') {
      this.onBack();
    } else if (event.key === 'enter') {
      const selected = this.items[this.selectedIndex];
      if (selected.id === 'start-register') {
        this.isLoading = true;
        this.statusMessage = `${COLORS.INFO}Iniciando navegador para registro...${COLORS.RESET}`;
        const res = await AuthService.registerWithBrowser();
        this.isLoading = false;
        if (res.success) {
          this.statusMessage = `${COLORS.SUCCESS}✓ ${res.message}${COLORS.RESET}`;
          this.onRegisterSuccess();
        } else {
          this.statusMessage = `${COLORS.ERROR}✗ ${res.message}${COLORS.RESET}`;
        }
      } else if (selected.id === 'back') {
        this.onBack();
      }
    }
  }
}
