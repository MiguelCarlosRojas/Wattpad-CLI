import { CommandDefinition, Suggestion } from '../../core/types/command.types';

export class CommandRegistry {
  private commands = new Map<string, CommandDefinition>();

  public register(cmd: CommandDefinition): void {
    const key = cmd.name.toLowerCase();
    this.commands.set(key, cmd);
  }

  public get(name: string): CommandDefinition | undefined {
    return this.commands.get(name.toLowerCase());
  }

  public getAll(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  public getSuggestions(input: string, limit: number = 8): Suggestion[] {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed.startsWith('/')) {
      return [];
    }

    const suggestions: Suggestion[] = [];

    for (const cmd of this.commands.values()) {
      // Check main command match
      if (cmd.name.startsWith(trimmed)) {
        suggestions.push({
          command: cmd.name,
          description: cmd.description,
          category: cmd.category,
          example: cmd.examples[0],
        });
      }

      // Check subcommands match (e.g. "/story new", "/connect word")
      if (cmd.subcommands) {
        for (const sub of cmd.subcommands) {
          const fullCmd = `${cmd.name} ${sub}`;
          if (fullCmd.startsWith(trimmed) && fullCmd !== cmd.name) {
            suggestions.push({
              command: fullCmd,
              description: `${cmd.description} (${sub})`,
              category: cmd.category,
              example: cmd.examples.find((e) => e.includes(sub)) || fullCmd,
            });
          }
        }
      }
    }

    return suggestions.slice(0, limit);
  }
}
