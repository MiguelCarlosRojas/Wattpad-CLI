import { RenderBlock } from '../../../types/command.types';
import { Theme, Chalk } from '../theme';

export class BlockCardRenderer {
  public static renderBlock(block: RenderBlock, width: number = 78): string[] {
    const lines: string[] = [];
    const contentWidth = Math.max(30, width - 4);
    const dividerWidth = Math.min(contentWidth, 76);

    // 1. Icon & Title Line
    let icon = '';
    let titleColor = Theme.colors.text;

    if (block.type === 'success') {
      icon = Chalk.hex(Theme.colors.success, Chalk.bold('✓ '));
      titleColor = Theme.colors.success;
    } else if (block.type === 'error') {
      icon = Chalk.hex(Theme.colors.error, Chalk.bold('✕ '));
      titleColor = Theme.colors.error;
    } else if (block.type === 'warning') {
      icon = Chalk.hex(Theme.colors.warning, Chalk.bold('⚠ '));
      titleColor = Theme.colors.warning;
    } else if (block.type === 'info') {
      icon = Chalk.hex(Theme.colors.info, Chalk.bold('ℹ '));
      titleColor = Theme.colors.info;
    }

    let badgePart = '';
    if (block.statusBadge) {
      const badgeColor = block.type === 'error' ? Theme.colors.error : block.type === 'success' ? Theme.colors.success : Theme.colors.info;
      badgePart = `  ${Chalk.hex(badgeColor, `[${block.statusBadge}]`)}`;
    }

    if (block.title) {
      lines.push(`  ${icon}${Chalk.bold(Chalk.hex(titleColor, block.title))}${badgePart}`);
    }

    // 2. Subtle Divider for general cards
    if (block.type === 'card' || !block.type) {
      lines.push(`  ${Chalk.hex(Theme.colors.divider, '─'.repeat(dividerWidth))}`);
    }

    // 3. Subtitle / Description
    if (block.subtitle) {
      const wrappedSub = this.wrapText(block.subtitle, contentWidth - 4);
      for (const sl of wrappedSub) {
        lines.push(`    ${Chalk.hex(Theme.colors.textSecondary, sl)}`);
      }
    }

    // 4. Fields (Label: Value alignment)
    if (block.fields && block.fields.length > 0) {
      for (const f of block.fields) {
        const labelStr = Chalk.hex(Theme.colors.muted, f.label.padEnd(20));
        const valStr = Chalk.bold(Chalk.hex(Theme.colors.text, f.value));
        lines.push(`    ${labelStr}  ${valStr}`);
      }
    }

    // 5. Body Content (Paragraphs / Explanations)
    if (block.content) {
      const rawLines = block.content.split('\n');
      for (const rl of rawLines) {
        if (!rl.trim()) {
          lines.push('');
        } else {
          const wrapped = this.wrapText(rl, contentWidth - 4);
          for (const wl of wrapped) {
            lines.push(`    ${Chalk.hex(Theme.colors.textSecondary, wl)}`);
          }
        }
      }
    }

    // 6. List Items
    if (block.items && block.items.length > 0) {
      for (const item of block.items) {
        if (typeof item === 'string') {
          lines.push(`    ${Chalk.hex(Theme.colors.muted, '•')} ${Chalk.hex(Theme.colors.text, item)}`);
        } else {
          const badgeStr = item.badge ? ` ${Chalk.hex(Theme.colors.info, `[${item.badge}]`)}` : '';
          const marker = Chalk.hex(Theme.colors.primary, '▸');
          lines.push(`    ${marker} ${Chalk.bold(Chalk.hex(Theme.colors.text, item.primary))}${badgeStr}`);
          if (item.secondary) {
            lines.push(`      ${Chalk.hex(Theme.colors.muted, item.secondary)}`);
          }
        }
      }
    }

    // Spacing after each block for readability
    lines.push('');
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
