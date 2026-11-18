import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export class CommandInput {
  public static render(
    value: string,
    cursorIndex: number,
    width: number,
    isFocused: boolean = true
  ): string[] {
    const lines: string[] = [];
    const sep = Chalk.hex(Theme.colors.surfaceBorder, '─'.repeat(width));
    lines.push(sep);

    const promptSymbol = isFocused
      ? Chalk.bold(Chalk.hex(Theme.colors.primary, '› '))
      : Chalk.dim('› ');

    let content: string;
    if (value.length === 0) {
      content = Chalk.dim('Escribe un comando o describe lo que quieres hacer... (ej: /help, /stories, /models)');
    } else {
      const before = value.slice(0, cursorIndex);
      const cursorChar = value.slice(cursorIndex, cursorIndex + 1) || ' ';
      const after = value.slice(cursorIndex + 1);

      const styledCursor = isFocused
        ? Chalk.inverse(cursorChar)
        : cursorChar;

      content = Chalk.hex(Theme.colors.text, before) + styledCursor + Chalk.hex(Theme.colors.text, after);
    }

    const line = `${promptSymbol}${content}`;
    lines.push(padEndVisible(line, width));
    return lines;
  }
}
