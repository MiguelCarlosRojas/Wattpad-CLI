import { CommandInput } from './command-input';

export class InputBoxRenderer {
  public static render(input: string, cursorIndex: number, width: number = 80, isFocused: boolean = true): string[] {
    return CommandInput.render(input, cursorIndex, width, isFocused);
  }
}

