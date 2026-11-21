import readline from 'readline';

export interface InteractiveView {
  getId(): string;
  getTitle(): string;
  getBreadcrumbs?(): string[];
  getStatusBarHint?(): string;
  render(width: number, height: number): string[];
  handleKeyPress(str: string, key: readline.Key): Promise<boolean | 'pop'> | boolean | 'pop';
  onMount?(): void;
  onUnmount?(): void;
}
