import { Theme, Chalk, padEndVisible } from '../theme';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  statusBadge?: string;
}

export class ConversationView {
  public static render(messages: ChatMessage[], isThinking: boolean, width: number): string[] {
    const lines: string[] = [];

    if (messages.length === 0) {
      lines.push('');
      lines.push(padEndVisible(`  ${Chalk.bold(Chalk.hex(Theme.colors.text, 'Asistente Literario — Wattpad AI Studio'))}`, width));
      lines.push(padEndVisible(`  ${Chalk.dim('Introduce un comando con "/" (ej. /help, /stories) o escribe una instrucción creativa.')}`, width));
      lines.push('');
      return lines;
    }

    for (const msg of messages) {
      lines.push('');
      if (msg.sender === 'user') {
        const promptMarker = Chalk.bold(Chalk.hex(Theme.colors.primary, '› '));
        const userText = Chalk.bold(Chalk.hex(Theme.colors.white, msg.content));
        lines.push(padEndVisible(`  ${promptMarker}${userText}`, width));
      } else if (msg.sender === 'assistant') {
        const aiMarker = Chalk.hex(Theme.colors.primary, '✦ ');
        const role = Chalk.dim('Wattpad Assistant');
        lines.push(padEndVisible(`  ${aiMarker}${role}`, width));

        // Format multiline content cleanly
        const rawLines = msg.content.split('\n');
        for (const raw of rawLines) {
          lines.push(padEndVisible(`    ${Chalk.hex(Theme.colors.text, raw)}`, width));
        }
      } else {
        // System message
        lines.push(padEndVisible(`  ${Chalk.dim(`ℹ ${msg.content}`)}`, width));
      }
    }

    if (isThinking) {
      lines.push('');
      lines.push(padEndVisible(`  ${Chalk.hex(Theme.colors.primary, '●')} ${Chalk.dim('Generando respuesta literaria en la nube...')}`, width));
    }

    return lines;
  }
}
