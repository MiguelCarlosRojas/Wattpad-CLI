#!/usr/bin/env bun
import { Application } from './cli/app/application';
import { LifecycleManager } from './app/lifecycle';

async function main(): Promise<void> {
  const app = new Application();
  LifecycleManager.setup(app as any);
  await app.run();
}

main().catch((err) => {
  console.error('Error fatal al iniciar Wattpad CLI:', err);
  process.exit(1);
});
