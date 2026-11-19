export class CommandHistory {
  private history: string[] = [];
  private pointer: number = -1;
  private currentDraft: string = '';

  constructor(initialHistory: string[] = []) {
    this.history = [...initialHistory];
  }

  public push(command: string): void {
    const trimmed = command.trim();
    if (!trimmed) return;

    // Avoid duplicate adjacent entries
    if (this.history.length === 0 || this.history[this.history.length - 1] !== trimmed) {
      this.history.push(trimmed);
    }
    this.pointer = -1;
    this.currentDraft = '';
  }

  public navigateUp(currentInput: string = ''): string | null {
    if (this.history.length === 0) return null;

    if (this.pointer === -1) {
      this.currentDraft = currentInput;
      this.pointer = this.history.length - 1;
      return this.history[this.pointer];
    }

    if (this.pointer > 0) {
      this.pointer--;
      return this.history[this.pointer];
    }

    return this.history[0];
  }

  public navigateDown(): string | null {
    if (this.pointer === -1) return null;

    if (this.pointer < this.history.length - 1) {
      this.pointer++;
      return this.history[this.pointer];
    }

    // Reached current draft
    this.pointer = -1;
    return this.currentDraft;
  }

  public resetPointer(): void {
    this.pointer = -1;
    this.currentDraft = '';
  }

  public getAll(): string[] {
    return [...this.history];
  }
}
