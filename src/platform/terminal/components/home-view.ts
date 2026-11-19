import { ResponsiveLayoutConfig } from '../responsive';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';
import { WattpadUser } from '../../../features/account/types/account.types';
import { Story } from '../../../features/stories/types/story.types';
import { Chapter } from '../../../features/chapters/types/chapter.types';

export interface HomeViewProps {
  user: WattpadUser | null;
  isAuthenticated: boolean;
  stories: Story[];
  chapters: Chapter[];
  activeStoryId?: string | null;
  recentCommands: string[];
  width: number;
}

export class HomeView {
  public static render(props: HomeViewProps): string[] {
    const lines: string[] = [];
    const width = Math.max(50, props.width || 80);
    const borderColor = Theme.colors.surfaceBorder;

    lines.push('');

    if (!props.isAuthenticated || !props.user) {
      // =========================================================================
      // VISTA PRINCIPAL — CUANDO NO EXISTE CUENTA CONECTADA
      // =========================================================================
      const title = Chalk.bold(Chalk.hex(Theme.colors.primary, 'WATTPAD CLI'));
      const subtitle = Chalk.hex(Theme.colors.text, 'Herramienta Profesional de Terminal para Autores');
      lines.push(`  ${title}  ${Chalk.dim('·')}  ${subtitle}`);
      lines.push(
        Chalk.dim(
          '  Administra tu catálogo de novelas, organiza capítulos e importa manuscritos de Word, Notepad y Google Docs.'
        )
      );
      lines.push('');

      // Tarjeta de estado de conexión y bienvenida
      const cardWidth = Math.min(width - 4, 76);
      const topBorder =
        Chalk.hex(borderColor, Theme.borders.topLeft + Theme.borders.horizontal) +
        Chalk.hex(Theme.colors.warning, ' ESTADO DE CUENTA ') +
        Chalk.hex(borderColor, Theme.borders.horizontal.repeat(Math.max(2, cardWidth - 21)) + Theme.borders.topRight);
      lines.push(`  ${topBorder}`);

      const padRow = (content: string) => {
        const plainLen = stripAnsi(content).length;
        const padSpaces = Math.max(0, cardWidth - 2 - plainLen);
        return `  ${Chalk.hex(borderColor, Theme.borders.vertical)}${content}${' '.repeat(padSpaces)}${Chalk.hex(borderColor, Theme.borders.vertical)}`;
      };

      lines.push(padRow(' '));
      lines.push(
        padRow(
          `   ${Chalk.hex(Theme.colors.warning, '○')} ${Chalk.bold(Chalk.hex(Theme.colors.text, 'Estado de cuenta:'))} ${Chalk.dim('Sin conectar')}`
        )
      );
      lines.push(
        padRow(
          `   ${Chalk.dim('Para comenzar a publicar o sincronizar, conecta tu cuenta oficial de Wattpad:')}`
        )
      );
      lines.push(
        padRow(
          `   ${Chalk.bold(Chalk.hex(Theme.colors.primary, '› /login'))}    ${Chalk.hex(Theme.colors.textSecondary, 'Abre una ventana emergente independiente para iniciar sesión')}`
        )
      );
      lines.push(
        padRow(
          `   ${Chalk.bold(Chalk.hex(Theme.colors.primary, '› /register'))} ${Chalk.hex(Theme.colors.textSecondary, 'Crea una cuenta en la web oficial si aún no tienes una')}`
        )
      );
      lines.push(padRow(' '));

      const bottomBorder = Chalk.hex(
        borderColor,
        Theme.borders.bottomLeft + Theme.borders.horizontal.repeat(cardWidth - 2) + Theme.borders.bottomRight
      );
      lines.push(`  ${bottomBorder}`);
      lines.push('');

      // Panel de inicio rápido y comandos esenciales
      lines.push(Chalk.bold(Chalk.hex(Theme.colors.text, '  Comandos principales disponibles:')));
      lines.push(
        `    ${Chalk.hex(Theme.colors.primary, '› /connect')}        ${Chalk.dim('Administrador de documentos (.docx, .txt, Google Docs)')}`
      );
      lines.push(
        `    ${Chalk.hex(Theme.colors.primary, '› /stories')}        ${Chalk.dim('Explorar catálogo de novelas locales')}`
      );
      lines.push(
        `    ${Chalk.hex(Theme.colors.primary, '› /chapter import')} ${Chalk.dim('Importar y segmentar manuscritos como borradores')}`
      );
      lines.push(
        `    ${Chalk.hex(Theme.colors.primary, '› /help')}           ${Chalk.dim('Ver la lista completa de comandos organizados')}`
      );

      // Historial reciente si existe
      if (props.recentCommands && props.recentCommands.length > 0) {
        lines.push('');
        lines.push(Chalk.dim('  Últimos comandos ejecutados:'));
        const recents = props.recentCommands.slice(-3).reverse();
        for (const rc of recents) {
          lines.push(`    ${Chalk.dim('•')} ${Chalk.hex(Theme.colors.textSecondary, rc)}`);
        }
      }
    } else {
      // =========================================================================
      // VISTA PRINCIPAL — CUANDO EXISTE UNA CUENTA CONECTADA
      // =========================================================================
      const userDot = Chalk.hex(Theme.colors.success, '●');
      const authorBadge = Chalk.bold(Chalk.hex(Theme.colors.primary, `@${props.user.username}`));
      const authorName = props.user.name && props.user.name !== props.user.username ? ` (${props.user.name})` : '';
      lines.push(`  ${userDot} ${authorBadge}${Chalk.dim(authorName)}  ${Chalk.dim('·')}  ${Chalk.hex(Theme.colors.success, 'Conectado a Wattpad')}`);
      lines.push(Chalk.dim('  Sesión activa mediante perfil local seguro. Listo para publicar y gestionar obras.'));
      lines.push('');

      // Tarjeta con métricas de la cuenta y novelas
      const cardWidth = Math.min(width - 4, 76);
      const topBorder =
        Chalk.hex(borderColor, Theme.borders.topLeft + Theme.borders.horizontal) +
        Chalk.hex(Theme.colors.primary, ' CATÁLOGO Y DOCUMENTOS ') +
        Chalk.hex(borderColor, Theme.borders.horizontal.repeat(Math.max(2, cardWidth - 26)) + Theme.borders.topRight);
      lines.push(`  ${topBorder}`);

      const padRow = (content: string) => {
        const plainLen = stripAnsi(content).length;
        const padSpaces = Math.max(0, cardWidth - 2 - plainLen);
        return `  ${Chalk.hex(borderColor, Theme.borders.vertical)}${content}${' '.repeat(padSpaces)}${Chalk.hex(borderColor, Theme.borders.vertical)}`;
      };

      const storyCount = props.stories.length;
      const chapterCount = props.chapters.length;

      lines.push(padRow(' '));
      lines.push(
        padRow(
          `   ${Chalk.bold(Chalk.hex(Theme.colors.text, 'Novelas locales:'))}     ${Chalk.hex(Theme.colors.primary, `${storyCount} obra(s)`)} en catálogo`
        )
      );
      lines.push(
        padRow(
          `   ${Chalk.bold(Chalk.hex(Theme.colors.text, 'Capítulos creados:'))}   ${Chalk.hex(Theme.colors.text, `${chapterCount} capítulo(s)`)} registrados`
        )
      );
      lines.push(
        padRow(
          `   ${Chalk.bold(Chalk.hex(Theme.colors.text, 'Fuentes vinculadas:'))}  ${Chalk.hex(Theme.colors.success, '✓ Word (.docx)')}  ${Chalk.hex(Theme.colors.success, '✓ Bloc de Notas (.txt)')}  ${Chalk.hex(Theme.colors.info, 'Google Docs')}`
        )
      );

      if (props.activeStoryId) {
        const activeStory = props.stories.find((s) => s.id === props.activeStoryId);
        if (activeStory) {
          lines.push(
            padRow(
              `   ${Chalk.bold(Chalk.hex(Theme.colors.primary, 'Novela activa:'))}       ${activeStory.title} [${activeStory.id}]`
            )
          );
        }
      }

      lines.push(padRow(' '));

      const bottomBorder = Chalk.hex(
        borderColor,
        Theme.borders.bottomLeft + Theme.borders.horizontal.repeat(cardWidth - 2) + Theme.borders.bottomRight
      );
      lines.push(`  ${bottomBorder}`);
      lines.push('');

      // Accesos directos a operaciones de autor
      lines.push(Chalk.bold(Chalk.hex(Theme.colors.text, '  Operaciones disponibles:')));
      lines.push(
        `    ${Chalk.hex(Theme.colors.primary, '› /stories')}         ${Chalk.dim('Ver tus novelas y estadísticas')}`
      );
      lines.push(
        `    ${Chalk.hex(Theme.colors.primary, '› /story create')}     ${Chalk.dim('Crear una nueva novela con título y género')}`
      );
      lines.push(
        `    ${Chalk.hex(Theme.colors.primary, '› /chapter import')}  ${Chalk.dim('Segmentar manuscrito Word (.docx) o Bloc de Notas (.txt)')}`
      );
      lines.push(
        `    ${Chalk.hex(Theme.colors.primary, '› /connect')}         ${Chalk.dim('Ver administrador de manuscritos vinculados')}`
      );
      lines.push(
        `    ${Chalk.hex(Theme.colors.primary, '› /logout')}          ${Chalk.dim('Cerrar sesión y desconectar cuenta')}`
      );

      // Historial reciente
      if (props.recentCommands && props.recentCommands.length > 0) {
        lines.push('');
        lines.push(Chalk.dim('  Últimos comandos ejecutados:'));
        const recents = props.recentCommands.slice(-3).reverse();
        for (const rc of recents) {
          lines.push(`    ${Chalk.dim('•')} ${Chalk.hex(Theme.colors.textSecondary, rc)}`);
        }
      }
    }

    return lines;
  }
}
