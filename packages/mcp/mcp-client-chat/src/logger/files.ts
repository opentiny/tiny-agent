import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LogLevel } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const logDir = path.resolve(__dirname, '../../logs');
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function ensureLogDir() {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

function rotateLogIfNeeded(filePath: string) {
  if (fs.existsSync(filePath)) {
    const { size } = fs.statSync(filePath);
    if (size > MAX_SIZE) {
      const bakPath = filePath + '.bak';
      if (fs.existsSync(bakPath)) {
        fs.unlinkSync(bakPath); // 删除已有备份
      }
      fs.renameSync(filePath, bakPath); // 当前日志重命名为备份
      fs.writeFileSync(filePath, '');   // 新建空日志文件
    }
  }
}

export function writeLog(level: LogLevel, message: string) {
  ensureLogDir();
  const filePath = path.join(logDir, `${level}.log`);
  rotateLogIfNeeded(filePath);
  const logLine = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(filePath, logLine, 'utf8');
}
