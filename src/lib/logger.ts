export interface LogEntry {
  timestamp: Date;
  level: 'log' | 'error' | 'warn' | 'info' | 'debug';
  message: string;
  args: any[];
}

class Logger {
  private logs: LogEntry[] = [];
  private originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
    debug: typeof console.debug;
  };

  constructor() {
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };

    this.interceptConsole();
  }

  private interceptConsole() {
    const createInterceptor = (level: LogEntry['level']) => {
      return (...args: any[]) => {
        const message = args
          .map(arg => {
            if (typeof arg === 'string') return arg;
            if (arg instanceof Error) return arg.message;
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          })
          .join(' ');

        this.addLog(level, message, args);

        // Call original console method
        this.originalConsole[level](...args);
      };
    };

    console.log = createInterceptor('log');
    console.error = createInterceptor('error');
    console.warn = createInterceptor('warn');
    console.info = createInterceptor('info');
    console.debug = createInterceptor('debug');
  }

  private addLog(level: LogEntry['level'], message: string, args: any[]) {
    this.logs.push({
      timestamp: new Date(),
      level,
      message,
      args,
    });

    // Keep only last 1000 logs to prevent memory issues
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public getLogsAsText(): string {
    return this.logs
      .map(log => {
        const timestamp = log.timestamp.toISOString().replace('T', ' ').slice(0, 19);
        const level = log.level.toUpperCase().padEnd(5);
        return `[${timestamp}] ${level} ${log.message}`;
      })
      .join('\n');
  }

  public clearLogs() {
    this.logs = [];
  }

  public restoreConsole() {
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;
  }
}

export const logger = new Logger();