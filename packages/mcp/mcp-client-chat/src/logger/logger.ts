// packages/mcp/mcp-client-chat/src/logger/logger.ts
import type { LogLevel } from './types.js';
import { writeLog } from './files.js';

export class Logger {
  log(level: LogLevel, ...args: any[]) {
    const message = args.map(String).join(' ');
    if (typeof window !== 'undefined') {
      // 前端
      console[level](message);
    } else {
      // 后端
      writeLog(level, message);
      // 同时输出到控制台
      // console[level](message);
    }
  }
  info(...args: any[]) {
    this.log('info', ...args);
  }
  error(...args: any[]) {
    this.log('error', ...args);
  }
  warn(...args: any[]) {
    this.log('warn', ...args);
  }
  debug(...args: any[]) {
    this.log('debug', ...args);
  }
}

export const logger = new Logger();
