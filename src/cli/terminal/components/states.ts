import { Theme, Chalk, padEndVisible } from '../theme';

export class LoadingState {
  public static render(message: string = 'Cargando datos cloud...', width: number): string[] {
    const lines: string[] = [];
    const spinner = Chalk.hex(Theme.colors.primary, '●');
    const text = Chalk.hex(Theme.colors.textSecondary, ` ${message}`);
    lines.push('');
    lines.push(padEndVisible(`  ${spinner}${text}`, width));
    lines.push('');
    return lines;
  }
}

export class EmptyState {
  public static render(title: string, subtitle: string, actionHint: string, width: number): string[] {
    const lines: string[] = [];
    lines.push('');
    lines.push(padEndVisible(`  ${Chalk.bold(Chalk.hex(Theme.colors.textSecondary, title))}`, width));
    lines.push(padEndVisible(`  ${Chalk.dim(subtitle)}`, width));
    if (actionHint) {
      lines.push(padEndVisible(`  ${Chalk.hex(Theme.colors.primary, actionHint)}`, width));
    }
    lines.push('');
    return lines;
  }
}

export class ErrorState {
  public static render(error: string, width: number): string[] {
    const lines: string[] = [];
    const icon = Chalk.hex(Theme.colors.error, '✕');
    lines.push('');
    lines.push(padEndVisible(`  ${icon} ${Chalk.hex(Theme.colors.error, error)}`, width));
    lines.push(padEndVisible(`  ${Chalk.dim('Verifica la conexión cloud o usa /help para opciones.')}`, width));
    lines.push('');
    return lines;
  }
}

export class Dialog {
  public static render(title: string, message: string, width: number): string[] {
    const lines: string[] = [];
    const border = '─'.repeat(Math.min(width - 4, 60));
    lines.push('');
    lines.push(`  ╭${border}╮`);
    lines.push(`  │ ${Chalk.bold(Chalk.hex(Theme.colors.warning, title))}`);
    lines.push(`  │ ${Chalk.hex(Theme.colors.text, message)}`);
    lines.push(`  │ ${Chalk.dim('[Enter] Confirmar  │  [Esc] Cancelar')}`);
    lines.push(`  ╰${border}╯`);
    lines.push('');
    return lines;
  }
}
