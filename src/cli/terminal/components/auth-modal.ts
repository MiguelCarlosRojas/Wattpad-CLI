import { Theme, Chalk, stripAnsi, padEndVisible } from '../theme';

export type AuthModalFocus = 'token' | 'connect' | 'cancel';

export interface AuthModalProps {
  isOpen: boolean;
  tokenValue: string;
  focus: AuthModalFocus;
  status: 'waiting' | 'verifying' | 'success' | 'error';
  errorMessage?: string;
  authenticatedUser?: {
    username: string;
    id?: string;
  } | null;
}

export class AuthModal {
  public static render(props: AuthModalProps, terminalWidth: number = 80): string[] {
    if (!props.isOpen) return [];

    const lines: string[] = [];
    const modalWidth = Math.min(58, Math.max(48, terminalWidth - 4));
    const innerWidth = modalWidth - 4; // Inside border and 1 space on each side

    // Top border
    const topTitle = props.status === 'success' ? ' Wattpad conectado ' : ' Conectar cuenta de Wattpad ';
    const topBarLength = Math.max(0, modalWidth - 3 - topTitle.length);
    const borderTop =
      Chalk.hex(Theme.colors.primary, Theme.borders.topLeft + Theme.borders.horizontal) +
      Chalk.bold(Chalk.hex(Theme.colors.primary, topTitle)) +
      Chalk.hex(Theme.colors.primary, Theme.borders.horizontal.repeat(topBarLength) + Theme.borders.topRight);

    lines.push(borderTop);

    const padLine = (content: string) => {
      const plainLen = stripAnsi(content).length;
      const padSpaces = Math.max(0, modalWidth - 2 - plainLen);
      return (
        Chalk.hex(Theme.colors.primary, Theme.borders.vertical) +
        content +
        ' '.repeat(padSpaces) +
        Chalk.hex(Theme.colors.primary, Theme.borders.vertical)
      );
    };

    const emptyLine = () => padLine(' ');

    lines.push(emptyLine());

    if (props.status === 'success' && props.authenticatedUser) {
      // Success card
      lines.push(padLine(`  Cuenta: ${Chalk.hex(Theme.colors.primary, Chalk.bold('@' + props.authenticatedUser.username))}`));
      lines.push(padLine(`  Estado: ${Chalk.hex(Theme.colors.success, 'Autorizada')}`));
      lines.push(padLine(`  Sesión: ${Chalk.hex(Theme.colors.success, 'Válida')}`));
      lines.push(emptyLine());
    } else {
      // Standard auth dialog
      lines.push(padLine('  Inicia sesión en el navegador que se abrió.'));
      lines.push(emptyLine());

      // Status subline
      let statusText = Chalk.dim('Esperando autorización');
      if (props.status === 'verifying') {
        statusText = Chalk.hex(Theme.colors.warning, 'Verificando con Wattpad oficial...');
      } else if (props.status === 'error') {
        statusText = Chalk.hex(Theme.colors.error, props.errorMessage || 'Credencial no autorizada');
      }
      lines.push(padLine(`  Estado: ${statusText}`));
      lines.push(emptyLine());

      lines.push(padLine('  Si dispones de un token oficial autorizado,'));
      lines.push(padLine('  puedes introducirlo aquí.'));
      lines.push(emptyLine());

      // Masked token input field
      const isTokenFocused = props.focus === 'token';
      const maxFieldLen = Math.max(16, innerWidth - 12);
      const maskedChars = '*'.repeat(props.tokenValue.length);
      const displayChars = maskedChars.length > maxFieldLen
        ? maskedChars.slice(-maxFieldLen)
        : maskedChars.padEnd(maxFieldLen, isTokenFocused && props.tokenValue.length === 0 ? '·' : ' ');

      const tokenBox = isTokenFocused
        ? Chalk.hex(Theme.colors.primary, '[') + Chalk.hex(Theme.colors.text, Chalk.bold(displayChars)) + Chalk.hex(Theme.colors.primary, ']')
        : Chalk.dim(`[${displayChars}]`);

      lines.push(padLine(`  Token: ${tokenBox}`));
      lines.push(emptyLine());

      // Action buttons: [ Conectar ]  [ Cancelar ]
      const isConnectFocused = props.focus === 'connect';
      const isCancelFocused = props.focus === 'cancel';

      const connectBtn = isConnectFocused
        ? Chalk.bgHex(Theme.colors.primary, Chalk.hex('#FFFFFF', Chalk.bold(' [ Conectar ] ')))
        : Chalk.hex(Theme.colors.text, ' [ Conectar ] ');

      const cancelBtn = isCancelFocused
        ? Chalk.bgHex(Theme.colors.surfaceBorder, Chalk.hex('#FFFFFF', Chalk.bold(' [ Cancelar ] ')))
        : Chalk.dim(' [ Cancelar ] ');

      lines.push(padLine(`  ${connectBtn}                     ${cancelBtn}`));
      lines.push(emptyLine());
    }

    // Bottom border
    const borderBottom =
      Chalk.hex(Theme.colors.primary, Theme.borders.bottomLeft) +
      Chalk.hex(Theme.colors.primary, Theme.borders.horizontal.repeat(modalWidth - 2)) +
      Chalk.hex(Theme.colors.primary, Theme.borders.bottomRight);

    lines.push(borderBottom);

    // Center modal horizontally in terminal width
    const leftPad = Math.max(0, Math.floor((terminalWidth - modalWidth) / 2));
    return lines.map((l) => ' '.repeat(leftPad) + l);
  }
}
