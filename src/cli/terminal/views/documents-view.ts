import { Story, Chapter } from '../../../shared/types';
import { Theme, Chalk, padEndVisible } from '../theme';

export interface DocumentsViewProps {
  stories: Story[];
  chapters: Chapter[];
  wordConnected?: boolean;
  notepadConnected?: boolean;
  googleConnected?: boolean;
}

export class DocumentsView {
  public static render(props: DocumentsViewProps, width: number): string[] {
    const lines: string[] = [];

    lines.push('');
    lines.push(padEndVisible(`  ${Chalk.bold(Chalk.hex(Theme.colors.text, 'Centro de Documentos y Editores Locales'))}  ${Chalk.hex(Theme.colors.primary, '[Wattpad CLI]')}`, width));
    lines.push(padEndVisible(`  ${Chalk.dim('Organización jerárquica de manuscritos para Word (.docx), Notepad (.txt) y Google Docs.')}`, width));
    lines.push('');

    // Status of Integrations
    const wordStatus = props.wordConnected !== false
      ? Chalk.hex(Theme.colors.success, '● Conectado (.docx)')
      : Chalk.dim('○ No conectado');
    const notepadStatus = props.notepadConnected !== false
      ? Chalk.hex(Theme.colors.success, '● Conectado (.txt UTF-8)')
      : Chalk.dim('○ No conectado');
    const googleStatus = props.googleConnected
      ? Chalk.hex(Theme.colors.success, '● Conectado (OAuth Cloud)')
      : Chalk.hex(Theme.colors.warning, '○ Desconectado (/connect google)');

    lines.push(padEndVisible(`  ${Chalk.dim('EDITORES:')}  Word: ${wordStatus}  │  Notepad: ${notepadStatus}  │  Google Docs: ${googleStatus}`, width));
    lines.push(padEndVisible(`  ${Chalk.hex(Theme.colors.surfaceBorder, '─'.repeat(Math.min(width - 4, 76)))}`, width));
    lines.push('');

    // Hierarchy tree: Mis novelas/
    lines.push(padEndVisible(`  ${Chalk.bold(Chalk.hex(Theme.colors.primary, '📂 Mis novelas/'))}`, width));

    if (!props.stories || props.stories.length === 0) {
      lines.push(padEndVisible(`     ${Chalk.dim('└── (No hay novelas creadas aún. Usa /story new para crear una)')}`, width));
    } else {
      for (let sIdx = 0; sIdx < props.stories.length; sIdx++) {
        const story = props.stories[sIdx];
        const isLastStory = sIdx === props.stories.length - 1;
        const sBranch = isLastStory ? '└──' : '├──';
        const sSub = isLastStory ? '    ' : '│   ';

        const ext = story.editorPreference === 'notepad' ? '.txt' : '.docx';
        const storyChaps = props.chapters.filter((c) => c.storyId === story.id);

        lines.push(padEndVisible(`  ${sBranch} 📁 ${Chalk.bold(Chalk.hex(Theme.colors.white, story.title))}  ${Chalk.dim(`[${story.id} · ${story.genre} · Editor: ${story.editorPreference.toUpperCase()}]`)}`, width));
        lines.push(padEndVisible(`  ${sSub}├── 📂 Capitulos/`, width));

        if (storyChaps.length === 0) {
          lines.push(padEndVisible(`  ${sSub}│   └── ${Chalk.dim('(Sin capítulos aún. Usa /chapter new)')}`, width));
        } else {
          for (let cIdx = 0; cIdx < storyChaps.length; cIdx++) {
            const chap = storyChaps[cIdx];
            const isLastChap = cIdx === storyChaps.length - 1;
            const cBranch = isLastChap ? '└──' : '├──';
            const safeTitle = chap.title.replace(/\s+/g, '_').replace(/[\/\\?%*:|"<>]/g, '_');
            const numPad = String(chap.chapterNumber).padStart(2, '0');
            const filename = `Capitulo_${numPad}_${safeTitle}${ext}`;
            const statusDot = chap.status === 'published'
              ? Chalk.hex(Theme.colors.primary, '● Wattpad')
              : chap.status === 'synced'
              ? Chalk.hex(Theme.colors.success, '● Sincronizado')
              : Chalk.hex(Theme.colors.warning, '○ Borrador local');

            lines.push(padEndVisible(`  ${sSub}│   ${cBranch} 📄 ${filename}  ${Chalk.dim(`(${chap.wordCount} palabras)`)}  ${statusDot}`, width));
          }
        }

        lines.push(padEndVisible(`  ${sSub}└── 📂 Notas/`, width));
        lines.push(padEndVisible(`  ${sSub}    └── 📄 notas_de_trama.txt  ${Chalk.dim('(Apuntes, escaleta y personajes)')}`, width));
      }
    }

    lines.push('');
    lines.push(padEndVisible(`  ${Chalk.dim('Comandos útiles:')}  ${Chalk.hex(Theme.colors.primary, '/story import <ruta>')}  │  ${Chalk.hex(Theme.colors.primary, '/chapter open <storyId> <capId>')}  │  ${Chalk.hex(Theme.colors.primary, '/publish status')}`, width));

    return lines;
  }
}
