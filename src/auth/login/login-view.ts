import { ViewInterface, KeyPressEvent, MenuItem } from '../../shared/types/navigation.types';
import { HeaderComponent } from '../../platform/terminal/components/header';
import { FooterComponent } from '../../platform/terminal/components/footer';
import { MenuListComponent } from '../../platform/terminal/components/menu-list';
import { AuthService } from '../auth-service';
import { COLORS } from '../../shared/constants/colors.constants';
import { padCenter } from '../../shared/utils/ansi';

export class LoginView implements ViewInterface {
  public id = 'login' as const;
  private selectedIndex = 0;
  private statusMessage = '';
  private isLoading = false;
  private inputMode: 'none' | 'token-user' | 'token-val' = 'none';
  private inputUser = '';
  private inputToken = '';

  private onLoginSuccess: () => void;
  private onBack: () => void;

  private items: MenuItem[] = [
    { id: 'browser', label: 'Iniciar con Navegador (Oficial)', subtitle: 'Abre Wattpad en el navegador y captura la sesión' },
    { id: 'token', label: 'Introducir Token de sesión', subtitle: 'Pega tu token de autenticación de Wattpad' },
    { id: 'back', label: 'Volver', subtitle: 'Regresar a la pantalla de bienvenida' },
  ];

  constructor(onLoginSuccess: () => void, onBack: () => void) {
    this.onLoginSuccess = onLoginSuccess;
    this.onBack = onBack;
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];

    lines.push(...HeaderComponent.render({ width }));

    lines.push(padCenter(`${COLORS.BOLD}${COLORS.TEXT_MAIN}Iniciar Sesión en Wattpad${COLORS.RESET}`, width));
    lines.push('');

    if (this.isLoading) {
      lines.push(padCenter(`${COLORS.ORANGE}⏳ Conectando con Wattpad... Por favor espera.${COLORS.RESET}`, width));
      lines.push('');
    } else if (this.statusMessage) {
      lines.push(padCenter(this.statusMessage, width));
      lines.push('');
    }

    if (this.inputMode === 'none') {
      const menuLines = MenuListComponent.render(this.items, this.selectedIndex, Math.max(8, Math.floor(width / 2) - 18));
      lines.push(...menuLines);
    } else if (this.inputMode === 'token-user') {
      lines.push('    Ingresa tu nombre de usuario de Wattpad:');
      lines.push(`    ${COLORS.ORANGE}❯${COLORS.RESET} ${this.inputUser}_`);
      lines.push('');
      lines.push(`    ${COLORS.TEXT_MUTED}[Presiona Enter para continuar, Esc para cancelar]${COLORS.RESET}`);
    } else if (this.inputMode === 'token-val') {
      lines.push(`    Usuario: @${this.inputUser}`);
      lines.push('    Pega o introduce tu token de sesión:');
      const masked = this.inputToken.length > 8 ? `${this.inputToken.substring(0, 4)}••••${this.inputToken.slice(-4)}` : this.inputToken;
      lines.push(`    ${COLORS.ORANGE}❯${COLORS.RESET} ${masked}_`);
      lines.push('');
      lines.push(`    ${COLORS.TEXT_MUTED}[Presiona Enter para verificar, Esc para cancelar]${COLORS.RESET}`);
    }

    const currentLines = lines.length;
    const remaining = Math.max(1, height - currentLines - 4);
    for (let i = 0; i < remaining; i++) {
      lines.push('');
    }

    lines.push(...FooterComponent.render(['↑↓ Navegar', 'Enter Confirmar', 'Esc Volver', 'Ctrl+C Salir'], width));
    return lines;
  }

  public async handleKey(event: KeyPressEvent): Promise<void> {
    if (this.isLoading) return;

    if (this.inputMode === 'token-user') {
      if (event.key === 'escape') {
        this.inputMode = 'none';
        this.statusMessage = '';
      } else if (event.key === 'enter') {
        if (this.inputUser.trim()) {
          this.inputMode = 'token-val';
        }
      } else if (event.key === 'backspace') {
        this.inputUser = this.inputUser.slice(0, -1);
      } else if (event.key.length === 1 && !event.ctrl && !event.alt) {
        this.inputUser += event.key;
      }
      return;
    }

    if (this.inputMode === 'token-val') {
      if (event.key === 'escape') {
        this.inputMode = 'none';
      } else if (event.key === 'enter') {
        if (this.inputToken.trim()) {
          this.isLoading = true;
          this.statusMessage = `${COLORS.INFO}Verificando token con Wattpad...${COLORS.RESET}`;
          const res = await AuthService.loginWithToken(this.inputToken, this.inputUser);
          this.isLoading = false;
          if (res.success) {
            this.statusMessage = `${COLORS.SUCCESS}✓ ${res.message}${COLORS.RESET}`;
            this.onLoginSuccess();
          } else {
            this.statusMessage = `${COLORS.ERROR}✗ ${res.message}${COLORS.RESET}`;
            this.inputMode = 'none';
          }
        }
      } else if (event.key === 'backspace') {
        this.inputToken = this.inputToken.slice(0, -1);
      } else if (event.key.length >= 1 && !event.ctrl && !event.alt) {
        this.inputToken += event.key;
      }
      return;
    }

    if (event.key === 'up') {
      this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
    } else if (event.key === 'down') {
      this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    } else if (event.key === 'escape') {
      this.onBack();
    } else if (event.key === 'enter') {
      const selected = this.items[this.selectedIndex];
      if (selected.id === 'browser') {
        this.isLoading = true;
        this.statusMessage = `${COLORS.INFO}Abriendo navegador para iniciar sesión en Wattpad...${COLORS.RESET}`;
        const res = await AuthService.loginWithBrowser();
        this.isLoading = false;
        if (res.success) {
          this.statusMessage = `${COLORS.SUCCESS}✓ ${res.message}${COLORS.RESET}`;
          this.onLoginSuccess();
        } else {
          this.statusMessage = `${COLORS.ERROR}✗ ${res.message}${COLORS.RESET}`;
        }
      } else if (selected.id === 'token') {
        this.inputMode = 'token-user';
        this.inputUser = '';
        this.inputToken = '';
        this.statusMessage = '';
      } else if (selected.id === 'back') {
        this.onBack();
      }
    }
  }
}
