import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { opsRoot } from '../utils/paths.js';

export interface AuditEntry {
  timestamp: string;
  hookName: string;
  result: 'blocked' | 'allowed';
  input: string;
}

// Sync append — avoids async complexity; hooks are low-frequency writes
export function appendAuditLog(entry: AuditEntry): void {
  const logDir = join(opsRoot(), 'logs');
  const logFile = join(logDir, 'hook-audit.log');

  mkdirSync(logDir, { recursive: true });

  const line = `${entry.timestamp} | ${entry.hookName} | ${entry.result} | ${entry.input}\n`;
  appendFileSync(logFile, line, { encoding: 'utf8' });
}
