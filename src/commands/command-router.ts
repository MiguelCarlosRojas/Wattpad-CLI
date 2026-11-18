import { CommandParser } from './command-parser';
import { CommandRegistry } from './command-registry';
import { CommandResult } from '../types/command.types';

export class CommandRouter {
  constructor(private registry: CommandRegistry) {}

  public async execute(app: any, rawInput: string): Promise<CommandResult> {
    const trimmed = rawInput.trim();

    if (!trimmed.startsWith('/')) {
      return {
        success: false,
        blocks: [
          {
            type: 'warning',
            title: 'Entrada no reconocida',
            content: 'Todos los comandos en Wattpad CLI deben comenzar con "/".\nEscribe /help para consultar la lista de comandos disponibles.',
          },
        ],
      };
    }

    const parsed = CommandParser.parse(trimmed);
    if (!parsed) {
      return {
        success: false,
        blocks: [
          {
            type: 'error',
            title: 'Comando vacío',
            content: 'Escribe / seguido del nombre del comando (ejemplo: /stories o /help).',
          },
        ],
      };
    }

    // Look up command in registry
    let cmd = this.registry.get(parsed.name);

    if (!cmd) {
      // Find fuzzy suggestions
      const suggestions = this.registry.getSuggestions(parsed.name, 4);
      return {
        success: false,
        blocks: [
          {
            type: 'error',
            title: `Comando desconocido: ${parsed.name}`,
            content: suggestions.length > 0
              ? '¿Quizás quisiste decir alguno de los siguientes?\n' +
                suggestions.map((s) => `  ${s.command.padEnd(16)} — ${s.description}`).join('\n')
              : 'Escribe /help para ver la lista completa de comandos válidos.',
          },
        ],
      };
    }

    try {
      return await cmd.execute(app, parsed);
    } catch (err: any) {
      return {
        success: false,
        blocks: [
          {
            type: 'error',
            title: `Error al ejecutar ${cmd.name}`,
            content: err.message || String(err),
          },
        ],
      };
    }
  }
}
