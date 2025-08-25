import log from 'loglevel';
import { LogLevel, LoggerConfig, LogMode } from './types.js';
import { getEnvironmentConfig } from './environment.js';
import { FileLogHandler } from './file-handler.js';
import { LoggerManager } from './manager.js';

export class Logger {
  private logger: log.Logger;
  private module: string;
  private config: LoggerConfig;
  private fileHandler?: FileLogHandler;
  private mode: LogMode;

  constructor(module: string, config?: LoggerConfig) {
    this.module = module;
    
    const envConfig = getEnvironmentConfig();
    const globalConfig = LoggerManager.getGlobalConfigInternal();
    this.config = { ...globalConfig, ...envConfig, ...config };
    
    this.mode = this.config.mode || LogMode.BOTH;
    
    this.logger = log.getLogger(module);
    this.logger.setLevel(this.config.level || LogLevel.INFO);
    
    // 如果需要文件日志，初始化文件处理器
    if (this.mode === LogMode.FILE_ONLY || this.mode === LogMode.BOTH) {
      this.fileHandler = new FileLogHandler(this.config);
    }
    
    // 如果是静默模式，设置日志级别为 SILENT
    if (this.mode === LogMode.SILENT) {
      this.logger.setLevel(LogLevel.SILENT);
    }
  }

  createChild(subModule: string, config?: LoggerConfig): Logger {
    return new Logger(`${this.module}:${subModule}`, config);
  }

  private async writeToFile(level: string, message: string, ...args: any[]): Promise<void> {
    if (this.fileHandler && (this.mode === LogMode.FILE_ONLY || this.mode === LogMode.BOTH)) {
      await this.fileHandler.write(level, this.module, message, ...args);
    }
  }

  private shouldLogToConsole(): boolean {
    return this.mode === LogMode.CONSOLE_ONLY || this.mode === LogMode.BOTH;
  }

  trace(message: string, ...args: any[]): void {
    if (this.shouldLogToConsole()) {
      this.logger.trace(`[${this.module}] ${message}`, ...args);
    }
    this.writeToFile('TRACE', message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLogToConsole()) {
      this.logger.debug(`[${this.module}] ${message}`, ...args);
    }
    this.writeToFile('DEBUG', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLogToConsole()) {
      this.logger.info(`[${this.module}] ${message}`, ...args);
    }
    this.writeToFile('INFO', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLogToConsole()) {
      this.logger.warn(`[${this.module}] ${message}`, ...args);
    }
    this.writeToFile('WARN', message, ...args);
  }

  error(message: string, error?: Error | any, ...args: any[]): void {
    if (this.shouldLogToConsole()) {
      if (error instanceof Error) {
        this.logger.error(`[${this.module}] ${message}`, error.message, error.stack, ...args);
      } else {
        this.logger.error(`[${this.module}] ${message}`, error, ...args);
      }
    }
    
    if (error instanceof Error) {
      this.writeToFile('ERROR', message, { error: error.message, stack: error.stack }, ...args);
    } else {
      this.writeToFile('ERROR', message, error, ...args);
    }
  }

  setLevel(level: LogLevel): void {
    this.logger.setLevel(level);
  }

  getLevel(): LogLevel {
    return this.logger.getLevel();
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  getMode(): LogMode {
    return this.mode;
  }

  isConsoleOnly(): boolean {
    return this.mode === LogMode.CONSOLE_ONLY;
  }
}
