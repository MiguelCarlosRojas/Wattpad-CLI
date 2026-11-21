import { COLORS } from '../../../shared/constants/colors.constants';
import { ASCII_LOGO, APP_CONSTANTS } from '../../../shared/constants/app.constants';
import { divider } from '../../../shared/utils/ansi';

export interface HeaderOptions {
  subtitle1?: string;
  subtitle2?: string;
  connectedUser?: string | null;
  workingDir?: string;
  width?: number;
}

export class HeaderComponent {
  public static render(options: HeaderOptions = {}): string[] {
    const width = options.width || process.stdout.columns || 80;
    const lines: string[] = [];

    let line1Sub = options.subtitle1;
    let line2Sub = options.subtitle2;

    if (options.connectedUser) {
      line1Sub = `${COLORS.SUCCESS}●${COLORS.RESET} ${COLORS.TEXT_MAIN}@${options.connectedUser}${COLORS.RESET} ${COLORS.TEXT_MUTED}· Conectado${COLORS.RESET}`;
      line2Sub = `${COLORS.TEXT_MUTED}${options.workingDir || '~/Documents/Wattpad'}${COLORS.RESET}`;
    } else if (!line1Sub) {
      line1Sub = `${COLORS.TEXT_MUTED}${APP_CONSTANTS.TAGLINE}${COLORS.RESET}`;
      line2Sub = `${COLORS.TEXT_DIM}${APP_CONSTANTS.DESCRIPTION}${COLORS.RESET}`;
    }

    const titleLine = `${COLORS.BOLD}${COLORS.ORANGE}${APP_CONSTANTS.NAME} v${APP_CONSTANTS.VERSION}${COLORS.RESET}`;

    // Línea 1
    lines.push(
      `  ${COLORS.ORANGE}${ASCII_LOGO[0]}${COLORS.RESET}     ${titleLine}`
    );
    // Línea 2
    lines.push(
      `  ${COLORS.ORANGE}${ASCII_LOGO[1]}${COLORS.RESET}     ${line1Sub}`
    );
    // Línea 3
    lines.push(
      `  ${COLORS.ORANGE}${ASCII_LOGO[2]}${COLORS.RESET}     ${line2Sub}`
    );

    lines.push('');
    lines.push(divider(width));
    lines.push('');

    return lines;
  }
}
