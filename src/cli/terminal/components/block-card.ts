import { RenderBlock } from '../../../types/command.types';
import { Theme, Chalk } from '../theme';

export class BlockCardRenderer {
  public static renderBlock(block: RenderBlock, width: number = 78): string[] {
    const lines: string[] = [];
    const b = Theme.borders;
    const contentWidth = Math.max(30, width - 4);

    let borderColor = Theme.colors.surfaceBorder;
    if (block.type === 'error') borderColor = Theme.colors.error;
    else if (block.type === 'success') borderColor = Theme.colors.success;
    else if (block.type === 'warning') borderColor = Theme.colors.warning;
    else if (block.type === 'info') borderColor = Theme.colors.info;
    else if (block.statusColor) borderColor = block.statusColor;

    // Header title with badge
    let rawTitleLen = 0;
    let titleStyled = '';

    if (block.title) {
      let badgePart = '';
      if (block.statusBadge) {
        badgePart = ` [${block.statusBadge}]`;
      }
      const rawTitle = ` ${block.title}${badgePart} `;
      rawTitleLen = rawTitle.length;

      const titleColor = block.type === 'error' ? Theme.colors.error : Theme.colors.primary;
      titleStyled = ` ${Chalk.bold(Chalk.hex(titleColor, block.title))}${block.statusBadge ? ` ${Chalk.hex(Theme.colors.cyan, `[${block.statusBadge}]`)}` : ''} `;
    }

    const remainingTop = Math.max(0, contentWidth - rawTitleLen);
    lines.push(
      Chalk.hex(borderColor, `${b.topLeft}${b.horizontal}`) +
        titleStyled +
        Chalk.hex(borderColor, `${b.horizontal.repeat(remainingTop)}${b.topRight}`)
    );

    // Subtitle
    if (block.subtitle) {
      const subLines = this.wrapText(block.subtitle, contentWidth - 4);
      for (const sl of subLines) {
        lines.push(
          `${Chalk.hex(borderColor, b.vertical)}  ${Chalk.dim(sl.padEnd(contentWidth - 2))}  ${Chalk.hex(borderColor, b.vertical)}`
        );
      }
      lines.push(`${Chalk.hex(borderColor, b.vertical)}${' '.repeat(contentWidth + 2)}${Chalk.hex(borderColor, b.vertical)}`);
    }

    // Fields
    if (block.fields && block.fields.length > 0) {
      for (const f of block.fields) {
        const labelStyled = Chalk.bold(Chalk.hex(Theme.colors.white, f.label.padEnd(18)));
        const valStyled = Chalk.hex(Theme.colors.text, f.value);
        const rawText = `${f.label.padEnd(18)}: ${f.value}`;
        const remaining = Math.max(0, contentWidth - 2 - rawText.length);
        lines.push(
          `${Chalk.hex(borderColor, b.vertical)}  ${labelStyled}: ${valStyled}${' '.repeat(remaining)}${Chalk.hex(borderColor, b.vertical)}`
        );
      }
    }

    // Content body
    if (block.content) {
      if (block.fields && block.fields.length > 0) {
        lines.push(`${Chalk.hex(borderColor, b.vertical)}${' '.repeat(contentWidth + 2)}${Chalk.hex(borderColor, b.vertical)}`);
      }
      const rawLines = block.content.split('\n');
      for (const rl of rawLines) {
        const wrapped = this.wrapText(rl, contentWidth - 4);
        if (wrapped.length === 0) {
          lines.push(`${Chalk.hex(borderColor, b.vertical)}${' '.repeat(contentWidth + 2)}${Chalk.hex(borderColor, b.vertical)}`);
        } else {
          for (const wl of wrapped) {
            const padded = wl.padEnd(contentWidth - 2);
            lines.push(`${Chalk.hex(borderColor, b.vertical)}  ${padded}  ${Chalk.hex(borderColor, b.vertical)}`);
          }
        }
      }
    }

    // Items list (Cards / individual blocks, NOT tables)
    if (block.items && block.items.length > 0) {
      for (const item of block.items) {
        if (typeof item === 'string') {
          const itemLine = `• ${item}`;
          const remaining = Math.max(0, contentWidth - 2 - itemLine.length);
          lines.push(
            `${Chalk.hex(borderColor, b.vertical)}  ${Chalk.hex(Theme.colors.text, itemLine)}${' '.repeat(remaining)}${Chalk.hex(borderColor, b.vertical)}`
          );
        } else {
          const badgeStr = item.badge ? ` ${Chalk.hex(Theme.colors.cyan, `[${item.badge}]`)}` : '';
          const primaryStr = `${Chalk.hex(Theme.colors.primary, '▸')} ${Chalk.bold(item.primary)}${badgeStr}`;
          const rawPrimary = `▸ ${item.primary}${item.badge ? ` [${item.badge}]` : ''}`;
          const remaining = Math.max(0, contentWidth - 2 - rawPrimary.length);
          lines.push(
            `${Chalk.hex(borderColor, b.vertical)}  ${primaryStr}${' '.repeat(remaining)}${Chalk.hex(borderColor, b.vertical)}`
          );

          if (item.secondary) {
            const rawSec = `   ${item.secondary}`;
            const remainingSec = Math.max(0, contentWidth - 2 - rawSec.length);
            lines.push(
              `${Chalk.hex(borderColor, b.vertical)}  ${Chalk.dim(rawSec)}${' '.repeat(remainingSec)}${Chalk.hex(borderColor, b.vertical)}`
            );
          }
        }
      }
    }

    // Bottom border
    lines.push(Chalk.hex(borderColor, `${b.bottomLeft}${b.horizontal.repeat(contentWidth + 2)}${b.bottomRight}`));
    return lines;
  }

  public static wrapText(text: string, maxWidth: number): string[] {
    if (!text) return [];
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const w of words) {
      if ((current + (current ? ' ' : '') + w).length <= maxWidth) {
        current += (current ? ' ' : '') + w;
      } else {
        if (current) lines.push(current);
        current = w;
      }
    }
    if (current) lines.push(current);
    return lines;
  }
}
