# 日志模块

基于 loglevel 的增强日志模块，支持文件日志和控制台日志，兼容前端和后端环境。

## 快速开始

### 基本使用

```typescript
import { createLogger } from './utils/logger/index.js';

const logger = createLogger('MyModule');

logger.info('应用启动');
logger.debug('调试信息', { userId: 123 });
logger.warn('警告信息');
logger.error('错误信息', new Error('Something went wrong'));
```

### 环境自动检测

- **Node.js 环境**：支持文件日志和控制台日志
- **浏览器环境**：自动降级为控制台日志

```typescript
import { isNodeEnv, isBrowserEnv } from './utils/logger/index.js';

console.log('Node.js 环境:', isNodeEnv);
console.log('浏览器环境:', isBrowserEnv);
```

## 配置参数

### 关键参数说明

```typescript
interface LoggerConfig {
  level?: LogLevel;                    // 日志级别：TRACE, DEBUG, INFO, WARN, ERROR, SILENT
  logDir?: string;                     // 日志文件存储目录（仅 Node.js）
  maxFileSize?: number;                // 单个日志文件最大大小，单位 MB
  maxFiles?: number;                   // 保留的日志文件数量
  mode?: LogMode;                      // 日志输出模式
}
```

### 日志级别

```typescript
enum LogLevel {
  TRACE = 0,   // 最详细的日志
  DEBUG = 1,   // 调试信息
  INFO = 2,    // 一般信息
  WARN = 3,    // 警告信息
  ERROR = 4,   // 错误信息
  SILENT = 5   // 静默模式
}
```

### 日志输出模式

```typescript
enum LogMode {
  CONSOLE_ONLY = 'console_only',    // 仅控制台输出
  FILE_ONLY = 'file_only',          // 仅文件输出
  BOTH = 'both',                    // 文件+控制台输出
  SILENT = 'silent'                 // 静默模式（不输出）
}
```

## 使用示例

### 1. 基本配置

```typescript
import { createLogger, LogLevel, LogMode } from './utils/logger/index.js';

const logger = createLogger('App', {
  level: LogLevel.DEBUG,
  logDir: './logs',
  maxFileSize: 10,  // 10MB
  maxFiles: 5,
  mode: LogMode.BOTH  // 文件+控制台
});
```

### 2. 仅控制台模式

```typescript
const logger = createLogger('DevApp', {
  mode: LogMode.CONSOLE_ONLY,  // 仅控制台，不写文件
  level: LogLevel.DEBUG
});
```

### 3. 仅文件模式

```typescript
const logger = createLogger('ProdApp', {
  mode: LogMode.FILE_ONLY,  // 仅文件，不输出控制台
  level: LogLevel.WARN
});
```

### 4. 全局配置

```typescript
import { LoggerManager, LogLevel, LogMode } from './utils/logger/index.js';

LoggerManager.setGlobalConfig({
  level: LogLevel.INFO,
  logDir: './logs',
  mode: LogMode.BOTH
});

const logger = createLogger('Module'); // 使用全局配置
```

## 环境变量配置

支持通过环境变量配置（仅 Node.js 环境）：

```bash
LOG_LEVEL=DEBUG              # 日志级别
LOG_DIR=./logs              # 日志目录
LOG_MAX_FILE_SIZE=10        # 文件大小限制（MB）
LOG_MAX_FILES=5             # 文件数量限制
LOG_MODE=BOTH               # 日志输出模式
```

## 推荐配置

### 开发环境

```typescript
const devConfig = {
  level: LogLevel.DEBUG,
  logDir: './logs/dev',
  maxFileSize: 10,
  maxFiles: 3,
  mode: LogMode.BOTH
};
```

### 生产环境

```typescript
const prodConfig = {
  level: LogLevel.WARN,
  logDir: './logs/prod',
  maxFileSize: 50,
  maxFiles: 10,
  mode: LogMode.FILE_ONLY
};
```

### 浏览器环境

```typescript
const browserConfig = {
  level: LogLevel.DEBUG,
  mode: LogMode.CONSOLE_ONLY
};
```

## API 参考

### 主要方法

```typescript
// 创建日志器
createLogger(module: string, config?: LoggerConfig): Logger

// 日志方法
logger.trace(message: string, ...args: any[]): void
logger.debug(message: string, ...args: any[]): void
logger.info(message: string, ...args: any[]): void
logger.warn(message: string, ...args: any[]): void
logger.error(message: string, error?: Error | any, ...args: any[]): void

// 配置方法
logger.setLevel(level: LogLevel): void
logger.getLevel(): LogLevel
logger.getConfig(): LoggerConfig
logger.getMode(): LogMode
logger.isConsoleOnly(): boolean

// 全局配置
LoggerManager.setGlobalConfig(config: LoggerConfig): void
LoggerManager.getGlobalConfig(): LoggerConfig
LoggerManager.loadConfigFromEnv(): void
```

### 环境检测

```typescript
isNodeEnv: boolean           // 是否为 Node.js 环境
isBrowserEnv: boolean        // 是否为浏览器环境
getEnvironmentConfig(): Partial<LoggerConfig>  // 获取环境配置
```
