import { LogLevel, LoggerConfig, LogMode } from './types.js';
import { isNodeEnv } from './environment.js';

const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  logDir: './logs',
  maxFileSize: 10,
  maxFiles: 5,
  mode: LogMode.BOTH
};

let globalConfig: LoggerConfig = { ...DEFAULT_CONFIG };

export class LoggerManager {
  static setGlobalConfig(config: LoggerConfig): void {
    globalConfig = { ...DEFAULT_CONFIG, ...config };
  }

  static getGlobalConfig(): LoggerConfig {
    return { ...globalConfig };
  }

  static loadConfigFromEnv(): void {
    if (!isNodeEnv) {
      return;
    }

    const config: LoggerConfig = {};

    if (process.env.LOG_LEVEL) {
      const level = LogLevel[process.env.LOG_LEVEL.toUpperCase() as keyof typeof LogLevel];
      if (level !== undefined) {
        config.level = level;
      }
    }

    if (process.env.LOG_DIR) {
      config.logDir = process.env.LOG_DIR;
    }

    if (process.env.LOG_MAX_FILE_SIZE) {
      config.maxFileSize = parseInt(process.env.LOG_MAX_FILE_SIZE);
    }

    if (process.env.LOG_MAX_FILES) {
      config.maxFiles = parseInt(process.env.LOG_MAX_FILES);
    }

    if (process.env.LOG_MODE) {
      const mode = LogMode[process.env.LOG_MODE.toUpperCase() as keyof typeof LogMode];
      if (mode !== undefined) {
        config.mode = mode;
      }
    }

    this.setGlobalConfig(config);
  }

  static getGlobalConfigInternal(): LoggerConfig {
    return globalConfig;
  }

  static getEnvironmentInfo(): { isNode: boolean; isBrowser: boolean } {
    return {
      isNode: !!isNodeEnv,
      isBrowser: typeof window !== 'undefined' && typeof document !== 'undefined'
    };
  }
}
