import { LoggerConfig, LogMode } from './types.js';

export const isNodeEnv = typeof process !== 'undefined' && 
  process.versions && 
  process.versions.node;

export const isBrowserEnv = typeof window !== 'undefined' && 
  typeof document !== 'undefined';

export function getEnvironmentConfig(): Partial<LoggerConfig> {
  if (isBrowserEnv || !isNodeEnv) {
    return {
      mode: LogMode.CONSOLE_ONLY
    };
  }
  return {};
}
