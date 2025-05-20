#!/usr/bin/env node
import path, { dirname } from 'node:path';
import fs from 'node:fs';
try {
  const configPath = path.resolve(process.cwd(), 'server.config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log(config);
} catch (error) {
  console.error(`无法加载配置文件: 'server.config.json'`);
  console.error(error.message);
  process.exit(1);
}

console.log('agent-server start');
