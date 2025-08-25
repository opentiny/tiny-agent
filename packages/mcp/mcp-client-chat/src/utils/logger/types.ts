export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  SILENT = 5
}

export enum LogMode {
  CONSOLE_ONLY = 'console_only',    // 仅控制台
  FILE_ONLY = 'file_only',          // 仅文件
  BOTH = 'both',                    // 文件+控制台
  SILENT = 'silent'                 // 静默模式
}

export interface LoggerConfig {
  level?: LogLevel;
  logDir?: string;
  maxFileSize?: number; // MB
  maxFiles?: number;
  mode?: LogMode;                   // 日志输出模式
}
