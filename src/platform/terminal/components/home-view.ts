import { ResponsiveLayoutConfig } from '../responsive';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';
import { WattpadUser } from '../../../features/account/types/account.types';
import { Story, RemoteWattpadStory, LocalManuscript } from '../../../features/stories/types/story.types';
import { Chapter } from '../../../features/chapters/types/chapter.types';

export interface HomeViewProps {
  user: WattpadUser | null;
  isAuthenticated: boolean;
  stories: Story[];
  chapters: Chapter[];
  remoteStories?: RemoteWattpadStory[];
  localManuscripts?: LocalManuscript[];
  activeStoryId?: string | null;
  recentCommands: string[];
  width: number;
  mode?: 'completa' | 'compacta' | 'zen';
}

export class HomeView {
  public static render(props: HomeViewProps): string[] {
    const lines: string[] = [];
    const width = Math.max(50, props.width || 80);
    const borderColor = Theme.colors.surfaceBorder;
    const mode = props.mode || 'completa';

    lines.push('');

    // =========================================================================
    // MODO ZEN: Minimalismo total, sin marcos pesados
    // =========================================================================
    if (mode === 'zen') {
      const user = props.user;
      const remoteStories = props.remoteStories || [];
      const published = remoteStories.filter((s) => s.published).length;
      const drafts = remoteStories.filter((s) => !s.published).length;
      const localCount = (props.localManuscripts || []).length;

      lines.push(
        Chalk.hex(Theme.colors.primary, '  WATTPAD CLI') +
        Chalk.dim(' · Modo Zen · ') +
        (user ? Chalk.hex(Theme.colors.success, `@${user.username}`) : Chalk.dim('Sin conectar'))
      );
      lines.push('');
      lines.push(
        `  ${Chalk.hex(Theme.colors.success, '●')} Publicadas: ${Chalk.bold(String(published))}   ` +
        `${Chalk.hex(Theme.colors.warning, '●')} Borradores: ${Chalk.bold(String(drafts))}   ` +
        `${Chalk.hex(Theme.colors.info, '●')} Manuscritos: ${Chalk.bold(String(localCount))}`
      );
      lines.push('');
      lines.push(Chalk.dim('  Escribe un comando o presiona Ctrl+P para abrir la paleta.'));
      return lines;
    }

    // =========================================================================
    // CASO: SIN CUENTA AUTENTICADA
    // =========================================================================
    if (!props.isAuthenticated || !props.user) {
      const cardWidth = Math.min(width - 4, 76);
      const topBorder =
        Chalk.hex(borderColor, Theme.borders.topLeft + Theme.borders.horizontal) +
        Chalk.hex(Theme.colors.warning, ' BIENVENIDO A WATTPAD CLI ') +
        Chalk.hex(borderColor, Theme.borders.horizontal.repeat(Math.max(2, cardWidth - 29)) + Theme.borders.topRight);
      lines.push(`  ${topBorder}`);

      const padRow = (content: string) => {
        const plainLen = stripAnsi(content).length;
        const padSpaces = Math.max(0, cardWidth - 2 - plainLen);
        return `  ${Chalk.hex(borderColor, Theme.borders.vertical)}${content}${' '.repeat(padSpaces)}${Chalk.hex(borderColor, Theme.borders.vertical)}`;
      };

      lines.push(padRow(' '));
      lines.push(
        padRow(
          `   ${Chalk.bold(Chalk.hex(Theme.colors.primary, 'WATTPAD CLI'))}  ${Chalk.dim('—')}  ${Chalk.hex(Theme.colors.text, 'Herramienta Profesional de Terminal para Autores')}`
        )
      );
      lines.push(
        padRow(
          `   ${Chalk.dim('Administra tu catálogo de novelas, organiza capítulos e importa manuscritos.')}`
        )
      );
      lines.push(padRow(' '));
      lines.push(
        padRow(
          `   ${Chalk.hex(Theme.colors.warning, '○')} ${Chalk.bold(Chalk.hex(Theme.colors.text, 'Estado de cuenta:'))} ${Chalk.dim('Sin conectar')}`
        )
      );
      lines.push(
        padRow(
          `   ${Chalk.dim('Conecta tu cuenta oficial de Wattpad para sincronizar y publicar:')}`
        )
      );
      lines.push(
        padRow(
          `   ${Chalk.bold(Chalk.hex(Theme.colors.primary, '› /login'))}    ${Chalk.hex(Theme.colors.textSecondary, 'Abre ventana interactiva oficial para iniciar sesión')}`
        )
      );
      lines.push(
        padRow(
          `   ${Chalk.bold(Chalk.hex(Theme.colors.primary, '› /register'))} ${Chalk.hex(Theme.colors.textSecondary, 'Abre la página oficial para registrar una nueva cuenta')}`
        )
      );
      lines.push(padRow(' '));

      const bottomBorder = Chalk.hex(
        borderColor,
        Theme.borders.bottomLeft + Theme.borders.horizontal.repeat(cardWidth - 2) + Theme.borders.bottomRight
      );
      lines.push(`  ${bottomBorder}`);
      lines.push('');

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

      if (props.recentCommands && props.recentCommands.length > 0) {
        lines.push('');
        lines.push(Chalk.dim('  Últimos comandos ejecutados:'));
        const recents = props.recentCommands.slice(-3).reverse();
        for (const rc of recents) {
          lines.push(`    ${Chalk.dim('•')} ${Chalk.hex(Theme.colors.textSecondary, rc)}`);
        }
      }

      return lines;
    }

    // =========================================================================
    // CASO: CUENTA CONECTADA CON IDENTIDAD OFICIAL
    // =========================================================================
    const user = props.user;
    const authorUsername = user.username.startsWith('@') ? user.username : `@${user.username}`;
    const authorName = user.name && user.name !== user.username ? user.name : user.username;

    const remoteStories = props.remoteStories || [];
    const publishedStories = remoteStories.filter((s) => s.published);
    const wattpadDrafts = remoteStories.filter((s) => !s.published);
    const localManuscripts = props.localManuscripts || [];

    const publishedCount = publishedStories.length;
    const draftCount = wattpadDrafts.length;
    const localManuscriptsCount = localManuscripts.length;

    let draftChaptersCount = 0;
    for (const s of wattpadDrafts) {
      draftChaptersCount += Math.max(s.numParts || 0, s.parts?.length || 0);
    }

    let publishedChaptersCount = 0;
    for (const s of publishedStories) {
      publishedChaptersCount += Math.max(s.publishedCount || s.numParts || 0, s.parts?.length || 0);
    }

    let localChaptersCount = props.chapters.length;
    for (const m of localManuscripts) {
      localChaptersCount += (m.chapterCount || 1);
    }

    const cardWidth = Math.min(width - 4, 76);

    const padRow = (content: string, boxW: number = cardWidth) => {
      const plainLen = stripAnsi(content).length;
      const padSpaces = Math.max(0, boxW - 2 - plainLen);
      return `  ${Chalk.hex(borderColor, Theme.borders.vertical)}${content}${' '.repeat(padSpaces)}${Chalk.hex(borderColor, Theme.borders.vertical)}`;
    };

    // 1. BANNER DE INICIO Y CUENTA
    const headerTitle = ` CUENTA WATTPAD: ${authorUsername.toUpperCase()} `;
    const topBorder =
      Chalk.hex(borderColor, Theme.borders.topLeft + Theme.borders.horizontal) +
      Chalk.bold(Chalk.hex(Theme.colors.primary, headerTitle)) +
      Chalk.hex(borderColor, Theme.borders.horizontal.repeat(Math.max(2, cardWidth - 3 - headerTitle.length)) + Theme.borders.topRight);
    lines.push(`  ${topBorder}`);

    lines.push(padRow(' '));
    lines.push(
      padRow(
        `   ${Chalk.hex(Theme.colors.success, '●')} ${Chalk.bold(Chalk.hex(Theme.colors.text, 'Autor oficial:'))}  ${Chalk.bold(Chalk.hex(Theme.colors.primary, authorUsername))} ${Chalk.dim(`(${authorName})`)}  ${Chalk.dim('·')}  ${Chalk.hex(Theme.colors.success, 'Conectado')}`
      )
    );
    lines.push(
      padRow(
        `   ${Chalk.dim('Sesión activa en Wattpad. Catálogo verificado con el portal de autor.')}`
      )
    );
    lines.push(padRow(' '));

    const bottomHeaderBorder = Chalk.hex(
      borderColor,
      Theme.borders.bottomLeft + Theme.borders.horizontal.repeat(cardWidth - 2) + Theme.borders.bottomRight
    );
    lines.push(`  ${bottomHeaderBorder}`);
    lines.push('');

    // 2. GRID VIPCODE 3 COLUMNAS: MIS NOVELAS
    if (cardWidth >= 70 && mode !== 'compacta') {
      // Formato Grid 3 Columnas: [PUBLICADAS] [BORRADORES] [LOCALES]
      const colW = Math.floor((cardWidth - 4) / 3);
      const gap = '  ';

      const renderColTop = (title: string, color: string) => {
        const titleText = ` ${title} `;
        const barLen = Math.max(2, colW - 3 - titleText.length);
        return (
          Chalk.hex(borderColor, Theme.borders.topLeft + Theme.borders.horizontal) +
          Chalk.bold(Chalk.hex(color, titleText)) +
          Chalk.hex(borderColor, Theme.borders.horizontal.repeat(barLen) + Theme.borders.topRight)
        );
      };

      const renderColBottom = () => {
        return Chalk.hex(
          borderColor,
          Theme.borders.bottomLeft + Theme.borders.horizontal.repeat(colW - 2) + Theme.borders.bottomRight
        );
      };

      const padColRow = (content: string) => {
        const plainLen = stripAnsi(content).length;
        const padSpaces = Math.max(0, colW - 2 - plainLen);
        return (
          Chalk.hex(borderColor, Theme.borders.vertical) +
          content +
          ' '.repeat(padSpaces) +
          Chalk.hex(borderColor, Theme.borders.vertical)
        );
      };

      const lineTop = `  ${renderColTop('PUBLICADAS', Theme.colors.success)}${gap}${renderColTop('BORRADORES', Theme.colors.primary)}${gap}${renderColTop('LOCALES', Theme.colors.info)}`;
      lines.push(lineTop);

      const r1 = `  ${padColRow(`  ${Chalk.bold(Chalk.hex(Theme.colors.success, `${publishedCount} obra(s)`))}`)}${gap}${padColRow(`  ${Chalk.bold(Chalk.hex(Theme.colors.primary, `${draftCount} borrador(es)`))}`)}${gap}${padColRow(`  ${Chalk.bold(Chalk.hex(Theme.colors.info, `${localManuscriptsCount} archivo(s)`))}`)}`;
      lines.push(r1);

      const r2 = `  ${padColRow(`  ${Chalk.dim(`${publishedChaptersCount} cap. publicados`)}`)}${gap}${padColRow(`  ${Chalk.dim(`${draftChaptersCount} cap. borradores`)}`)}${gap}${padColRow(`  ${Chalk.dim('Word .docx y .txt')}`)}`;
      lines.push(r2);

      const lineBottom = `  ${renderColBottom()}${gap}${renderColBottom()}${gap}${renderColBottom()}`;
      lines.push(lineBottom);

      const totalChapters = (publishedChaptersCount + draftChaptersCount) > 0
        ? (publishedChaptersCount + draftChaptersCount)
        : (localChaptersCount || props.chapters.length);

      lines.push('');
      const detailTop =
        Chalk.hex(borderColor, Theme.borders.topLeft + Theme.borders.horizontal) +
        Chalk.hex(Theme.colors.primary, ' CATÁLOGO Y DOCUMENTOS ') +
        Chalk.hex(borderColor, Theme.borders.horizontal.repeat(Math.max(2, cardWidth - 26)) + Theme.borders.topRight);
      lines.push(`  ${detailTop}`);
      lines.push(
        padRow(
          `   ${Chalk.bold(Chalk.hex(Theme.colors.text, 'Novelas publicadas:'))}    ${Chalk.hex(Theme.colors.success, `${publishedCount} obra(s)`)} en Wattpad`
        )
      );
      lines.push(
        padRow(
          `   ${Chalk.bold(Chalk.hex(Theme.colors.text, 'Borradores en Wattpad:'))}  ${Chalk.hex(Theme.colors.warning, `${draftCount} obra(s)`)} en Wattpad`
        )
      );
      lines.push(
        padRow(
          `   ${Chalk.bold(Chalk.hex(Theme.colors.text, 'Manuscritos locales:'))}    ${Chalk.hex(Theme.colors.primary, `${localManuscriptsCount} archivo(s)`)} (.docx, .txt)`
        )
      );
      lines.push(
        padRow(
          `   ${Chalk.bold(Chalk.hex(Theme.colors.text, 'Capítulos registrados:'))}  ${Chalk.hex(Theme.colors.text, `${totalChapters} capítulo(s)`)}`
        )
      );
      lines.push(
        padRow(
          `   ${Chalk.bold(Chalk.hex(Theme.colors.text, 'Fuentes vinculadas:'))}     ${Chalk.hex(Theme.colors.success, '✓ Word (.docx)')}  ${Chalk.hex(Theme.colors.success, '✓ Bloc de Notas (.txt)')}  ${Chalk.hex(Theme.colors.info, 'Google Docs')}`
        )
      );
      const detailBottom = Chalk.hex(
        borderColor,
        Theme.borders.bottomLeft + Theme.borders.horizontal.repeat(cardWidth - 2) + Theme.borders.bottomRight
      );
      lines.push(`  ${detailBottom}`);
    } else {
      // Formato compacto o terminal estrecha
      const miniTop =
        Chalk.hex(borderColor, Theme.borders.topLeft + Theme.borders.horizontal) +
        Chalk.bold(Chalk.hex(Theme.colors.primary, ' RESUMEN DE CATÁLOGO ')) +
        Chalk.hex(borderColor, Theme.borders.horizontal.repeat(Math.max(2, cardWidth - 25)) + Theme.borders.topRight);
      lines.push(`  ${miniTop}`);
      lines.push(padRow(`   ${Chalk.hex(Theme.colors.success, '●')} Publicadas en Wattpad:   ${Chalk.bold(String(publishedCount))} obra(s) (${publishedChaptersCount} capítulos)`));
      lines.push(padRow(`   ${Chalk.hex(Theme.colors.warning, '●')} Borradores en Wattpad:    ${Chalk.bold(String(draftCount))} obra(s) (${draftChaptersCount} capítulos)`));
      lines.push(padRow(`   ${Chalk.hex(Theme.colors.info, '●')} Manuscritos locales:      ${Chalk.bold(String(localManuscriptsCount))} archivo(s) (.docx, .txt)`));
      const miniBottom = Chalk.hex(
        borderColor,
        Theme.borders.bottomLeft + Theme.borders.horizontal.repeat(cardWidth - 2) + Theme.borders.bottomRight
      );
      lines.push(`  ${miniBottom}`);
    }

    lines.push('');

    // 3. OPERACIONES DISPONIBLES
    lines.push(Chalk.bold(Chalk.hex(Theme.colors.text, '  Operaciones disponibles:')));
    lines.push(
      `    ${Chalk.hex(Theme.colors.primary, '› /stories')}         ${Chalk.dim('Catálogo unificado oficial (obras Wattpad y manuscritos)')}`
    );
    lines.push(
      `    ${Chalk.hex(Theme.colors.primary, '› /refresh')}         ${Chalk.dim('Actualizar sesión, obras en Wattpad y manuscritos')}`
    );
    lines.push(
      `    ${Chalk.hex(Theme.colors.primary, '› /connect')}         ${Chalk.dim('Administrador de documentos vinculados (.docx, .txt)')}`
    );
    lines.push(
      `    ${Chalk.hex(Theme.colors.primary, '› /chapter import')}  ${Chalk.dim('Segmentar manuscrito Word o Notepad en capítulos')}`
    );
    lines.push(
      `    ${Chalk.hex(Theme.colors.primary, '› /interface')}       ${Chalk.dim('Cambiar modo visual: /interface [completa|compacta|zen]')}`
    );
    lines.push(
      `    ${Chalk.hex(Theme.colors.primary, '› /help')}            ${Chalk.dim('Ver lista completa de comandos organizados')}`
    );

    // 4. ACTIVIDAD RECIENTE
    if (props.recentCommands && props.recentCommands.length > 0) {
      lines.push('');
      lines.push(Chalk.dim('  Actividad reciente:'));
      const recents = props.recentCommands.slice(-3).reverse();
      for (const rc of recents) {
        lines.push(`    ${Chalk.dim('•')} ${Chalk.hex(Theme.colors.textSecondary, rc)}`);
      }
    }

    return lines;
  }
}
