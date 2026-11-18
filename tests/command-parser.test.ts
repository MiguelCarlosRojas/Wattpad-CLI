import { describe, expect, it } from 'bun:test';
import { CommandParser } from '../src/commands/command-parser';

describe('CommandParser', () => {
  it('should ignore input not starting with /', () => {
    expect(CommandParser.parse('hello world')).toBeNull();
    expect(CommandParser.parse('wattpad story new')).toBeNull();
  });

  it('should parse simple command without arguments', () => {
    const parsed = CommandParser.parse('/stories');
    expect(parsed).not.toBeNull();
    expect(parsed?.name).toBe('/stories');
    expect(parsed?.args.length).toBe(0);
    expect(parsed?.subcommand).toBeUndefined();
  });

  it('should parse command with subcommand and arguments', () => {
    const parsed = CommandParser.parse('/story open NOV-0001');
    expect(parsed).not.toBeNull();
    expect(parsed?.name).toBe('/story');
    expect(parsed?.subcommand).toBe('open');
    expect(parsed?.args).toEqual(['NOV-0001']);
  });

  it('should handle quoted strings with spaces', () => {
    const parsed = CommandParser.parse('/story new "El Secreto del Bosque Olvidado"');
    expect(parsed).not.toBeNull();
    expect(parsed?.name).toBe('/story');
    expect(parsed?.subcommand).toBe('new');
    expect(parsed?.args[0]).toBe('El Secreto del Bosque Olvidado');
  });

  it('should parse long flags and short flags', () => {
    const parsed = CommandParser.parse('/story new "Mi Novela" --genre=Fantasía -p word --mature');
    expect(parsed).not.toBeNull();
    expect(parsed?.args[0]).toBe('Mi Novela');
    expect(parsed?.flags.genre).toBe('Fantasía');
    expect(parsed?.flags.p).toBe('word');
    expect(parsed?.flags.mature).toBe(true);
  });
});
