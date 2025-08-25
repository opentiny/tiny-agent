import { LoggerConfig } from './types.js';
import { isNodeEnv } from './environment.js';

export class FileLogHandler {
  private logDir: string = './logs';
  private maxFileSize: number = 10 * 1024 * 1024;
  private maxFiles: number = 5;
  private currentFile: string = '';
  private currentSize: number = 0;
  private isNode: boolean;

  constructor(config: LoggerConfig) {
    this.isNode = !!isNodeEnv;
    
    if (!this.isNode) {
      return;
    }

    this.logDir = config.logDir || './logs';
    this.maxFileSize = (config.maxFileSize || 10) * 1024 * 1024;
    this.maxFiles = config.maxFiles || 5;
    this.currentFile = this.getLogFileName();
    this.ensureLogDir();
  }

  private async ensureLogDir(): Promise<void> {
    if (!this.isNode) return;

    try {
      const fs = await import('fs');
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('[Logger] Failed to create log directory:', error);
    }
  }

  private getLogFileName(): string {
    if (!this.isNode) return '';
    
    const date = new Date().toISOString().split('T')[0];
    return `${this.logDir}/app-${date}.log`;
  }

  private async rotateLogFile(): Promise<void> {
    if (!this.isNode) return;

    try {
      const fs = await import('fs');
      
      const oldFile = this.currentFile;
      this.currentFile = this.getLogFileName();
      
      if (fs.existsSync(oldFile) && this.currentSize > this.maxFileSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const rotatedFile = oldFile.replace('.log', `-${timestamp}.log`);
        fs.renameSync(oldFile, rotatedFile);
        
        await this.cleanupOldFiles();
      }
      
      this.currentSize = 0;
    } catch (error) {
      console.error('[Logger] Failed to rotate log file:', error);
    }
  }

  private async cleanupOldFiles(): Promise<void> {
    if (!this.isNode) return;

    try {
      const fs = await import('fs');
      
      const files = fs.readdirSync(this.logDir)
        .filter(file => file.startsWith('app-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: `${this.logDir}/${file}`,
          mtime: fs.statSync(`${this.logDir}/${file}`).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      if (files.length > this.maxFiles) {
        files.slice(this.maxFiles).forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
    } catch (error) {
      console.error('[Logger] Failed to cleanup old files:', error);
    }
  }

  async write(level: string, module: string, message: string, ...args: any[]): Promise<void> {
    if (!this.isNode) return;

    try {
      const fs = await import('fs');
      
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level,
        module,
        message,
        args: args.length > 0 ? args : undefined
      };

      const logLine = JSON.stringify(logEntry) + '\n';
      const logBuffer = Buffer.from(logLine, 'utf8');

      if (this.currentSize + logBuffer.length > this.maxFileSize) {
        await this.rotateLogFile();
      }

      fs.appendFileSync(this.currentFile, logLine);
      this.currentSize += logBuffer.length;
    } catch (error) {
      console.error('[Logger] Failed to write to log file:', error);
    }
  }
}
