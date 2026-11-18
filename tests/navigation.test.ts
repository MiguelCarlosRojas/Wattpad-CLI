import { describe, expect, it } from 'bun:test';
import { SelectorList } from '../src/cli/terminal/components/selector-list';
import { FocusManager } from '../src/cli/terminal/focus-manager';

describe('Interactive Keyboard Navigation & Selection', () => {
  it('should navigate up and down through list items', () => {
    const selector = new SelectorList('HISTORIAS', [
      { id: 'NOV-0001', primary: 'Mi primera novela' },
      { id: 'NOV-0002', primary: 'El último invierno' },
      { id: 'NOV-0003', primary: 'El reino perdido' },
    ]);

    expect(selector.getSelectedIndex()).toBe(0);
    expect(selector.getSelectedItem()?.id).toBe('NOV-0001');

    selector.navigateDown();
    expect(selector.getSelectedIndex()).toBe(1);
    expect(selector.getSelectedItem()?.id).toBe('NOV-0002');

    selector.navigateDown();
    expect(selector.getSelectedIndex()).toBe(2);
    expect(selector.getSelectedItem()?.id).toBe('NOV-0003');

    // Should not exceed bounds
    selector.navigateDown();
    expect(selector.getSelectedIndex()).toBe(2);

    // Navigate back up
    selector.navigateUp();
    expect(selector.getSelectedIndex()).toBe(1);
    expect(selector.getSelectedItem()?.id).toBe('NOV-0002');
  });

  it('should render distinct visual marker and orange background on the selected item', () => {
    const selector = new SelectorList('MIS HISTORIAS', [
      { id: 'NOV-0001', primary: 'Mi primera novela' },
      { id: 'NOV-0002', primary: 'El último invierno' },
    ]);

    selector.navigateDown(); // Selects index 1 (El último invierno)

    const lines = selector.render(80, true);
    const selectedLine = lines.find((l) => l.includes('El último invierno'));

    expect(selectedLine).toBeDefined();
    // Must contain indicator ›
    expect(selectedLine).toContain('›');
    // Must contain TrueColor orange background ANSI escape
    expect(selectedLine).toContain('\x1b[48;2;255;97;34m');
  });

  it('should manage keyboard focus priority correctly', () => {
    const focus = new FocusManager();

    // Default focus
    expect(focus.getFocus()).toBe('input');

    // When selector is opened, focus switches to selector
    focus.setSelectorActive(true);
    expect(focus.getFocus()).toBe('selector');

    // When suggestions pop up, suggestions take top priority
    focus.setSuggestionsActive(true);
    expect(focus.getFocus()).toBe('suggestions');

    // When suggestions close, focus returns to selector
    focus.setSuggestionsActive(false);
    expect(focus.getFocus()).toBe('selector');

    // When selector closes, focus returns to input
    focus.setSelectorActive(false);
    expect(focus.getFocus()).toBe('input');
  });
});
