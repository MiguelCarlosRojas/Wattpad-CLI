import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface ProjectContextProps {
  activeStoryTitle?: string | null;
  activeStoryId?: string | null;
  activeChapterTitle?: string | null;
  activeChapterId?: string | null;
  wordCount?: number;
  editorPreference?: string;
  syncState?: string;
}

export class ProjectContext {
  public static render(props: ProjectContextProps, width: number, maxHeight: number): string[] {
    const lines: string[] = [];

    lines.push(Chalk.dim(Chalk.bold('NOVELA Y CAPÍTULO ACTIVO')));
    lines.push(Chalk.hex(Theme.colors.surfaceBorder, '─'.repeat(width)));

    if (props.activeStoryTitle) {
      lines.push(Chalk.dim('Novela en curso:'));
      lines.push(Chalk.bold(Chalk.hex(Theme.colors.primary, props.activeStoryTitle)));
      if (props.activeStoryId) {
        lines.push(Chalk.dim(`ID: ${props.activeStoryId}`));
      }
      lines.push('');

      lines.push(Chalk.dim('Capítulo activo:'));
      lines.push(Chalk.hex(Theme.colors.text, props.activeChapterTitle || 'Ninguno seleccionado'));
      if (props.activeChapterId) {
        lines.push(Chalk.dim(`ID: ${props.activeChapterId}`));
      }
      lines.push('');

      lines.push(Chalk.dim('Recuento palabras:'));
      lines.push(Chalk.hex(Theme.colors.text, `${props.wordCount || 0} palabras`));
      lines.push('');

      lines.push(Chalk.dim('Editor de trabajo:'));
      lines.push(Chalk.hex(Theme.colors.info, (props.editorPreference || 'word').toUpperCase()));
      lines.push('');

      lines.push(Chalk.dim('Estado de sincronización:'));
      lines.push(Chalk.hex(Theme.colors.success, `● ${props.syncState || 'Al día'}`));
    } else {
      lines.push(Chalk.dim('Sin novela activa.'));
      lines.push(Chalk.dim('Selecciona una novela con:'));
      lines.push(Chalk.hex(Theme.colors.textSecondary, '/story open NOV-xxxx'));
      lines.push(Chalk.dim('o pulsa ') + Chalk.hex(Theme.colors.primary, 'Mis novelas') + Chalk.dim(' en el menú.'));
    }

    lines.push('');
    lines.push(Chalk.dim(Chalk.bold('ATAJOS RÁPIDOS')));
    lines.push(Chalk.hex(Theme.colors.surfaceBorder, '─'.repeat(width)));
    lines.push(Chalk.dim('• ') + Chalk.hex(Theme.colors.textSecondary, '/stories') + Chalk.dim(' : Listar novelas'));
    lines.push(Chalk.dim('• ') + Chalk.hex(Theme.colors.textSecondary, '/chapters') + Chalk.dim(' : Ver capítulos'));
    lines.push(Chalk.dim('• ') + Chalk.hex(Theme.colors.textSecondary, '/documents') + Chalk.dim(' : Árbol de manuscritos'));
    lines.push(Chalk.dim('• ') + Chalk.hex(Theme.colors.textSecondary, '/publish status') + Chalk.dim(' : Estado publicaciones'));

    while (lines.length < maxHeight) {
      lines.push(' '.repeat(width));
    }
    return lines.slice(0, maxHeight).map((l) => padEndVisible(l, width));
  }
}
