#!/usr/bin/env bun
process.env.DOTENV_QUIET = 'true';
import { Application } from './app/application';
import { LifecycleManager } from '../app/lifecycle';
import { BlockCardRenderer } from './terminal/components/block-card';

async function main(): Promise<void> {
  const app = new Application();
  LifecycleManager.setup(app as any);

  const rawArgs = process.argv.slice(2);
  if (rawArgs.length > 0) {
    await app.init();
    let commandStr = rawArgs.join(' ').trim();
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

main().catch((err) => {
  console.error('Error fatal al iniciar Wattpad CLI:', err);
  process.exit(1);
});
