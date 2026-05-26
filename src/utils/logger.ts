import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export interface Logger {
  debug(msg: string, data?: Record<string, unknown>): void;
  info(msg: string, data?: Record<string, unknown>): void;
  warn(msg: string, data?: Record<string, unknown>): void;
  error(msg: string, data?: Record<string, unknown>): void;
}

export function createLogger(logPath: string, level: LogLevel): Logger {
  mkdirSync(dirname(logPath), { recursive: true });

  function write(lvl: LogLevel, msg: string, data?: Record<string, unknown>): void {
    if (LEVEL_RANK[lvl] < LEVEL_RANK[level]) return;
    const record = JSON.stringify({
      timestamp: new Date().toISOString(),
      level: lvl,
      msg,
      ...data,
    });
    appendFileSync(logPath, `${record}\n`, 'utf-8');
  }

  return {
    debug: (msg, data) => write('debug', msg, data),
    info: (msg, data) => write('info', msg, data),
    warn: (msg, data) => write('warn', msg, data),
    error: (msg, data) => write('error', msg, data),
  };
}
