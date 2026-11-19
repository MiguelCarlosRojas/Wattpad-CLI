import { describe, expect, it } from 'bun:test';
import { SuggestionsDropdown } from '../src/cli/terminal/components/suggestions';
import { CommandHistory } from '../src/commands/history';
import { stripAnsi } from '../src/cli/terminal/theme';

describe('Interactive Keyboard Navigation & Selection', () => {
  it('should navigate up and down through command history', () => {
    const history = new CommandHistory();
    history.push('/story new "Mi Novela"');
    history.push('/chapters');
    history.push('/publish status');

    // Initial navigation up
    expect(history.navigateUp()).toBe('/publish status');
    expect(history.navigateUp()).toBe('/chapters');
    expect(history.navigateUp()).toBe('/story new "Mi Novela"');
    // Top boundary
    expect(history.navigateUp()).toBe('/story new "Mi Novela"');

    // Navigate back down
    expect(history.navigateDown()).toBe('/chapters');
    expect(history.navigateDown()).toBe('/publish status');
    expect(history.navigateDown()).toBe('');
  });

  it('should render distinct visual marker on selected suggestion item', () => {
    const suggestions = [
      { command: '/story new', description: 'Crear nueva novela', category: 'Novelas' },
      { command: '/story open', description: 'Abrir novela', category: 'Novelas' },
    ];

    const lines = SuggestionsDropdown.render(suggestions, 1, 80);
    const text = stripAnsi(lines.join('\n'));

    expect(text).toContain('/story new');
    expect(text).toContain('/story open');
    expect(text).toContain('›');
  });
});
