import { CommandResult, RenderBlock } from '../../../types/command.types';
import { Theme, Chalk, padEndVisible, stripAnsi } from '../theme';

export interface OutputViewProps {
  command: string;
  result: CommandResult;
}

export class CommandOutputView {
  public static render(props: OutputViewProps, width: number): string[] {
    const lines: string[] = [];
    const res = props.result;

    lines.push('');
    // Command Header
    const cmdBadge = res.success
      ? Chalk.hex(Theme.colors.success, '● ÉXITO')
      : Chalk.hex(Theme.colors.error, '✕ ERROR');
    lines.push(padEndVisible(`  ${Chalk.bold(Chalk.hex(Theme.colors.primary, '› ' + props.command))}   ${cmdBadge}`, width));
    lines.push(padEndVisible(`  ${Chalk.hex(Theme.colors.surfaceBorder, '─'.repeat(Math.min(width - 4, 76)))}`, width));

    // Message
    if (res.message) {
      lines.push('');
      const msgLines = res.message.split('\n');
      for (const m of msgLines) {
        lines.push(padEndVisible(`  ${Chalk.hex(Theme.colors.text, m)}`, width));
      }
    }

    // Render Blocks
    if (res.blocks && res.blocks.length > 0) {
      for (const block of res.blocks) {
        lines.push('');
        if (block.title) {
          const titleColor = block.type === 'error'
            ? Theme.colors.error
            : block.type === 'success'
            ? Theme.colors.success
            : Theme.colors.primary;
          lines.push(padEndVisible(`  ${Chalk.bold(Chalk.hex(titleColor, block.title))}`, width));
        }

        if (block.subtitle) {
          lines.push(padEndVisible(`  ${Chalk.dim(block.subtitle)}`, width));
        }

        if (block.content) {
          const contentLines = block.content.split('\n');
          for (const cl of contentLines) {
            lines.push(padEndVisible(`    ${Chalk.hex(Theme.colors.text, cl)}`, width));
          }
        }

        if (block.fields && block.fields.length > 0) {
          for (const f of block.fields) {
            const label = Chalk.dim(f.label.padEnd(18));
            const val = Chalk.hex(Theme.colors.white, f.value);
            lines.push(padEndVisible(`    ${label}: ${val}`, width));
          }
        }
      }
    }

    lines.push('');
    lines.push(padEndVisible(`  ${Chalk.dim('─'.repeat(Math.min(width - 4, 76)))}`, width));
    lines.push(padEndVisible(`  ${Chalk.dim('Pulsa ')}${Chalk.hex(Theme.colors.primary, 'Esc')}${Chalk.dim(' para volver al Inicio  │  Escribe un nuevo comando abajo')}`, width));

    return lines;
  }
}
