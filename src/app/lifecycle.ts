import { Application } from './application';

export class LifecycleManager {
  private static registered = false;

  public static setup(app: Application): void {
    if (this.registered) return;
    this.registered = true;

    const cleanup = async () => {
      try {
        await app.shutdown();
      } catch {}
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('uncaughtException', async (err) => {
      try {
        await app.shutdown();
      } catch {}
      console.error('\x1b[31m[Error no controlado]:\x1b[0m', err);
      process.exit(1);
    });
  }
}
