export type FocusTarget = 'input' | 'selector' | 'suggestions';

export interface SelectorItem {
  id: string;
  primary: string;
  secondary?: string;
  badge?: string;
  badgeColor?: string;
  payload?: any;
  action?: () => Promise<void> | void;
}

export class FocusManager {
  private currentFocus: FocusTarget = 'input';
  private hasActiveSelector: boolean = false;
  private hasActiveSuggestions: boolean = false;

  public setFocus(target: FocusTarget): void {
    this.currentFocus = target;
  }

  public getFocus(): FocusTarget {
    if (this.hasActiveSuggestions) return 'suggestions';
    if (this.hasActiveSelector && this.currentFocus === 'selector') return 'selector';
    return 'input';
  }

  public setSelectorActive(active: boolean): void {
    this.hasActiveSelector = active;
    if (active) {
      this.currentFocus = 'selector';
    } else if (this.currentFocus === 'selector') {
      this.currentFocus = 'input';
    }
  }

  public setSuggestionsActive(active: boolean): void {
    this.hasActiveSuggestions = active;
  }

  public isSelectorActive(): boolean {
    return this.hasActiveSelector;
  }

  public isSuggestionsActive(): boolean {
    return this.hasActiveSuggestions;
  }

  public toggleFocus(): void {
    if (this.hasActiveSelector) {
      this.currentFocus = this.currentFocus === 'input' ? 'selector' : 'input';
    }
  }
}
