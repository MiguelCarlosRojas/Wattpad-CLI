#!/usr/bin/env bun
process.env.DOTENV_QUIET = 'true';
import { Application } from '../../platform/terminal/application';
import { LifecycleManager } from './lifecycle';
import { BlockCardRenderer } from '../../platform/terminal/components/block-card';

export async function bootstrap(): Promise<void> {
  const app = new Application();
  LifecycleManager.setup(app as any);

  const rawArgs = process.argv.slice(2);
  if (rawArgs.length > 0) {
    await app.init();
    let commandStr = rawArgs
      .map((a) => (a.includes(' ') && !a.startsWith('"') && !a.startsWith("'") ? `"${a}"` : a))
      .join(' ')
      .trim();
    if (commandStr === '--help' || commandStr === '-h' || commandStr === 'help') {
      commandStr = '/help';
    } else if (commandStr === '--version' || commandStr === '-v' || commandStr === 'version') {
      commandStr = '/version';
    } else if (!commandStr.startsWith('/')) {
      commandStr = `/${commandStr}`;
    }
    const result = await app.executeCommand(commandStr);
    if (result.blocks && result.blocks.length > 0) {
      for (const b of result.blocks) {
        const lines = BlockCardRenderer.renderBlock(b, 80);
        console.log(lines.join('\n'));
      }
    } else if (result.message) {
      console.log(result.message);
    }
    process.exit(result.success ? 0 : 1);
  }

  await app.run();
}

// Auto-run if executed directly as main module
if (typeof process !== 'undefined' && process.argv && process.argv[1]) {
  const isDirectEntry = process.argv[1].endsWith('main.ts') || process.argv[1].endsWith('main.js') || process.argv[1].endsWith('wattpad.exe') || process.argv[1].endsWith('wattpad');
  if (isDirectEntry) {
    bootstrap().catch((err) => {
      console.error('Error fatal al iniciar Wattpad CLI:', err);
      process.exit(1);
    });
  }
}
