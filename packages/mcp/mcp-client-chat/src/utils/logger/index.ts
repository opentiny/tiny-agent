import { Logger } from './core.js';
import { LoggerManager } from './manager.js';

LoggerManager.loadConfigFromEnv();

export const defaultLogger = new Logger('@opentiny/tiny-agent-mcp-client-chat');

export const createLogger = (module: string, config?: import('./types.js').LoggerConfig) => new Logger(module, config);

export * from './types.js';
export * from './environment.js';
export * from './core.js';
export * from './manager.js';
export * from './file-handler.js';
