export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private static levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private static currentLevel: LogLevel = 'info';

  public static setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  private static shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.currentLevel];
  }

  public static debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`\x1b[90m[DEBUG]\x1b[0m ${message}`, ...args);
    }
  }

  public static info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.log(`\x1b[36m[INFO]\x1b[0m ${message}`, ...args);
    }
  }

  public static warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`\x1b[33m[WARN]\x1b[0m ${message}`, ...args);
    }
  }

  public static error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`, ...args);
    }
  }
}
