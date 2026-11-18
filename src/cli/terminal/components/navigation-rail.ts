import { Theme, Chalk } from '../theme';

export class NavigationRailRenderer {
  public static readonly WIDTH = 22;

  public static render(activeSection: string = 'Inicio', height: number = 20): string[] {
    const lines: string[] = [];

    const formatHeader = (text: string) => Chalk.bold(Chalk.hex(Theme.colors.muted, text));
    const formatItem = (name: string, cmd: string) => {
      const isActive = activeSection.toLowerCase() === name.toLowerCase();
      if (isActive) {
        return `  ${Chalk.hex(Theme.colors.primary, '›')} ${Chalk.bold(Chalk.hex(Theme.colors.white, name))}`;
      }
      return `    ${Chalk.hex(Theme.colors.textSecondary, name)}`;
    };

    lines.push('');
    lines.push(` ${formatHeader('WORKSPACE')}`);
    lines.push(formatItem('Inicio', '/clear'));
    lines.push(formatItem('Biblioteca', '/stories'));
    lines.push(formatItem('Novelas', '/story'));
    lines.push(formatItem('Capítulos', '/chapters'));

    lines.push('');
    lines.push(` ${formatHeader('HERRAMIENTAS')}`);
    lines.push(formatItem('Modelos IA', '/models'));
    lines.push(formatItem('Integraciones', '/connect'));
    lines.push(formatItem('Sincronización', '/sync'));
    lines.push(formatItem('Publicación', '/publish'));

    lines.push('');
    lines.push(` ${formatHeader('CUENTA')}`);
    lines.push(formatItem('Perfil', '/profile'));
    lines.push(formatItem('Configuración', '/settings'));
    lines.push(formatItem('Ayuda', '/help'));

    // Pad to height
    while (lines.length < height) {
      lines.push('');
    }

    return lines.slice(0, height);
  }
}
