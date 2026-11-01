export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  component?: string;
  requestId?: string;
  roomCode?: string;
  gameSessionId?: string;
  roundId?: string;
  [key: string]: any;
}

export const logger = {
  log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level,
      message,
      ...context,
    };
    // Safe output: never log secrets or sensitive answers
    if (level === 'error') {
      console.error(JSON.stringify(payload));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(payload));
    } else {
      console.log(JSON.stringify(payload));
    }
  },
  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  },
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  },
  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  },
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, context);
    }
  },
};
