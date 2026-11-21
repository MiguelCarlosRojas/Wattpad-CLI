import readline from 'readline';
import { InteractiveView } from './interactive-view.interface';
import { WattpadUser } from '../../../features/account/types/account.types';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface ProfileViewProps {
  user: WattpadUser | null;
  storiesCount: number;
  draftsCount: number;
  manuscriptsCount: number;
  onNavigateToStories?: () => void;
  onRefresh?: () => Promise<void> | void;
}

export class InteractiveProfileView implements InteractiveView {
  private selectedSectionIndex: number = 0;
  private inDetails: boolean = false;

  private sections = [
    { id: 'profile', label: '1. Mi Perfil', desc: 'Nombre, usuario, biografía y avatar' },
    { id: 'stats', label: '2. Mis Estadísticas', desc: 'Obras, lecturas, votos y seguidores' },
    { id: 'works', label: '3. Mis Obras', desc: 'Catálogo de novelas publicadas y borradores' },
    { id: 'library', label: '4. Mi Biblioteca', desc: 'Historias y listas de lectura guardadas' },
    { id: 'inbox', label: '5. Buzón de Notificaciones', desc: 'Mensajes y avisos de Wattpad' },
    { id: 'refresh', label: '6. Actualizar Perfil', desc: 'Sincronizar información desde Wattpad' },
  ];

  constructor(private props: ProfileViewProps) {}

  public getId(): string {
    return 'profile-view';
  }

  public getTitle(): string {
    return 'PERFIL DE USUARIO';
  }

  public getBreadcrumbs(): string[] {
    return ['Wattpad CLI', 'Perfil'];
  }

  public getStatusBarHint(): string {
    if (this.inDetails) {
      return 'Esc Volver al menú de perfil  ·  Enter Ejecutar acción';
    }
    return '↑/↓ Seleccionar sección  ·  Enter Ver detalles  ·  Esc Volver a terminal';
  }

  public render(width: number, height: number): string[] {
    const lines: string[] = [];
    const w = Math.max(50, width);
    const innerW = w - 4;
    const user = this.props.user;

    // Cabecera
    const topBar =
      Chalk.hex(Theme.colors.surfaceBorder, '╭─ ') +
      Chalk.bold(Chalk.hex(Theme.colors.primary, 'PERFIL DE USUARIO WATTPAD')) +
      Chalk.hex(Theme.colors.surfaceBorder, ` ${'─'.repeat(Math.max(2, w - 29))}╮`);
    lines.push(topBar);

    if (this.inDetails) {
      const curSec = this.sections[this.selectedSectionIndex];
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.primary, `SECCIÓN: ${curSec.label}`)), innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
      lines.push(Chalk.hex(Theme.colors.surfaceBorder, `├${'─'.repeat(w - 2)}┤`));

      if (curSec.id === 'profile') {
        const username = user?.username ? `@${user.username}` : 'Sin conectar';
        const name = user?.name || user?.username || 'Usuario Wattpad';
        const bio = user?.description || 'Autor creativo en Wattpad CLI.';
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.text, `Nombre:     ${name}`)), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.hex(Theme.colors.info, `Usuario:    ${username}`), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.dim(`Biografía:  ${bio}`), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.dim(`Estado:     ${user ? 'Conectado con sesión activa' : 'Desconectado'}`), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      } else if (curSec.id === 'stats') {
        const votes = user?.votesReceived ?? 0;
        const followers = user?.numFollowers ?? 0;
        const following = user?.numFollowing ?? 0;
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.hex(Theme.colors.text, `  Novelas en catálogo:     ${this.props.storiesCount + this.props.draftsCount}`), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.hex(Theme.colors.text, `  Votos recibidos:         ${votes}`), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.hex(Theme.colors.text, `  Seguidores:              ${followers}`), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.hex(Theme.colors.text, `  Siguiendo:               ${following}`), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      } else if (curSec.id === 'works') {
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.hex(Theme.colors.text, `  Novelas publicadas:     ${this.props.storiesCount}`), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.hex(Theme.colors.warning, `  Borradores en Wattpad:  ${this.props.draftsCount}`), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.hex(Theme.colors.info, `  Manuscritos locales:    ${this.props.manuscriptsCount}`), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.primary, '  Pulsa Enter para abrir el catálogo interactivo (/stories)')), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      } else if (curSec.id === 'library') {
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.dim('  Acceso a novelas guardadas en la biblioteca del usuario.'), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.primary, '  Pulsa Enter para ver la biblioteca (/library)')), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      } else if (curSec.id === 'inbox') {
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.dim('  Buzón de notificaciones y alertas de Wattpad.'), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.primary, '  Pulsa Enter para consultar el buzón (/inbox)')), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      } else if (curSec.id === 'refresh') {
        lines.push(
          Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
          padEndVisible(Chalk.bold(Chalk.hex(Theme.colors.warning, '  Pulsa Enter para sincronizar y actualizar el perfil ahora')), innerW) +
          Chalk.hex(Theme.colors.surfaceBorder, ' │')
        );
      }

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

    // Menú Principal de Secciones
    this.sections.forEach((sec, idx) => {
      const isSelected = idx === this.selectedSectionIndex;
      const marker = isSelected ? Chalk.bold(Chalk.hex(Theme.colors.primary, ' › ')) : '   ';
      const labelStr = isSelected
        ? Chalk.bold(Chalk.hex(Theme.colors.primary, sec.label))
        : Chalk.hex(Theme.colors.text, sec.label);
      const descStr = Chalk.dim(` — ${sec.desc}`);
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible(`${marker}${labelStr}${descStr}`, innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    });

    while (lines.length < height - 4) {
      lines.push(
        Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
        padEndVisible('', innerW) +
        Chalk.hex(Theme.colors.surfaceBorder, ' │')
      );
    }

    lines.push(Chalk.hex(Theme.colors.surfaceBorder, `├${'─'.repeat(w - 2)}┤`));
    const curSec = this.sections[this.selectedSectionIndex];
    lines.push(
      Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
      padEndVisible(Chalk.hex(Theme.colors.textSecondary, `▸ ${curSec.desc}`), innerW) +
      Chalk.hex(Theme.colors.surfaceBorder, ' │')
    );
    lines.push(
      Chalk.hex(Theme.colors.surfaceBorder, '│ ') +
      padEndVisible(Chalk.dim('Enter: Ver sección   Esc: Volver'), innerW) +
      Chalk.hex(Theme.colors.surfaceBorder, ' │')
    );
    lines.push(Chalk.hex(Theme.colors.surfaceBorder, `╰${'─'.repeat(w - 2)}╯`));

    return lines;
  }

  public handleKeyPress(str: string, key: readline.Key): boolean | 'pop' {
    if (key.name === 'escape') {
      if (this.inDetails) {
        this.inDetails = false;
        return true;
      }
      return 'pop';
    }

    if (this.inDetails) {
      if (key.name === 'return') {
        const curSec = this.sections[this.selectedSectionIndex];
        if (curSec.id === 'works' && this.props.onNavigateToStories) {
          this.props.onNavigateToStories();
          return 'pop';
        }
        if (curSec.id === 'refresh' && this.props.onRefresh) {
          this.props.onRefresh();
          return 'pop';
        }
      }
      return true;
    }

    if (key.name === 'up') {
      if (this.selectedSectionIndex > 0) {
        this.selectedSectionIndex--;
      }
      return true;
    }

    if (key.name === 'down') {
      if (this.selectedSectionIndex < this.sections.length - 1) {
        this.selectedSectionIndex++;
      }
      return true;
    }

    if (key.name === 'return') {
      this.inDetails = true;
      return true;
    }

    return true;
  }
}
