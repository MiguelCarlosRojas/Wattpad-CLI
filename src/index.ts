#!/usr/bin/env bun
import { bootstrap } from './app/bootstrap/main';

bootstrap().catch((err) => {
  console.error('\x1b[31m[Error Fatal Wattpad CLI]:\x1b[0m', err.message);
  process.exit(1);
});
