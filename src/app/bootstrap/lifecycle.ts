import { TerminalAdapter } from '../../platform/terminal/terminal-adapter';

export class LifecycleManager {
  public static setup(onExit: () => void): void {
    const cleanup = () => {
      try {
        TerminalAdapter.exitAltBuffer();
      } catch {}
      onExit();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', () => {
      try {
        TerminalAdapter.exitAltBuffer();
      } catch {}
    });

    process.on('uncaughtException', (err) => {
      TerminalAdapter.exitAltBuffer();
      console.error('\x1b[31m[Error no controlado de Wattpad CLI]:\x1b[0m', err.message);
      process.exit(1);
    });
  }
}
