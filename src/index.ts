#!/usr/bin/env bun
import { bootstrap } from './app/bootstrap/main';

const args = process.argv.slice(2);
const isCliFlag = args.includes('--version') || args.includes('-v') || args.includes('--help') || args.includes('-h');
const isRenderOrServer = (Boolean(process.env.PORT) || Boolean(process.env.RENDER)) && !process.stdin.isTTY && !isCliFlag;

if (isRenderOrServer) {
  const { startServer } = await import('./server');
  startServer().catch((err) => {
    console.error('\x1b[31m[Error Fatal Servidor Render]:\x1b[0m', err.message);
    process.exit(1);
  });
} else {
  bootstrap().catch((err) => {
    console.error('\x1b[31m[Error Fatal Wattpad CLI]:\x1b[0m', err.message);
    process.exit(1);
  });
}
