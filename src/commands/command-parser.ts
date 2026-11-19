import { ParsedCommand } from '../types/command.types';

export class CommandParser {
  public static parse(input: string): ParsedCommand | null {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) {
      return null;
    }

    const tokens = this.tokenize(trimmed);
    if (tokens.length === 0) {
      return null;
    }

    const name = tokens[0].toLowerCase();
    const rest = tokens.slice(1);

    const args: string[] = [];
    const flags: Record<string, string | boolean> = {};

    let subcommand: string | undefined;

    for (let i = 0; i < rest.length; i++) {
      const token = rest[i];
      if (token.startsWith('--')) {
        const flagName = token.slice(2);
        if (flagName.includes('=')) {
          const [key, val] = flagName.split('=');
          flags[key] = val;
        } else if (i + 1 < rest.length && !rest[i + 1].startsWith('-')) {
          flags[flagName] = rest[i + 1];
          i++;
        } else {
          flags[flagName] = true;
        }
      } else if (token.startsWith('-') && token.length === 2) {
        const flagChar = token.slice(1);
        if (i + 1 < rest.length && !rest[i + 1].startsWith('-')) {
          flags[flagChar] = rest[i + 1];
          i++;
        } else {
          flags[flagChar] = true;
        }
      } else {
        if (!subcommand && args.length === 0 && !token.startsWith('-')) {
          // Check if first non-flag argument acts as subcommand
          subcommand = token.toLowerCase();
        } else {
          args.push(token);
        }
      }
    }

    return {
      raw: trimmed,
      name,
      subcommand,
      args,
      flags,
    };
  }

  private static tokenize(str: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (char === '\\' && i + 1 < str.length && (str[i + 1] === '"' || str[i + 1] === "'")) {
        current += str[i + 1];
        i++;
        continue;
      }

      if ((char === '"' || char === "'") && !inQuote) {
        inQuote = true;
        quoteChar = char;
        continue;
      }

      if (char === quoteChar && inQuote) {
        inQuote = false;
        quoteChar = '';
        continue;
      }

      if (/\s/.test(char) && !inQuote) {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
        continue;
      }

      current += char;
    }

    if (current.length > 0) {
      tokens.push(current);
    }

    return tokens;
  }
}
