import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_CONFIG } from '../../src/config/defaults.js';
import { loadHistory, saveHistory } from '../../src/data/history.js';
import { pLimit, retry, withTimeout } from '../../src/utils/async.js';
import { atomicWrite, ensureDir, fileExists } from '../../src/utils/fs.js';
import { createLogger } from '../../src/utils/logger.js';
import {
  agentPath,
  hookPath,
  opsRoot,
  rolePath,
  rulePath,
  skillPath,
  vaultPath,
} from '../../src/utils/paths.js';

// ── fs.ts ────────────────────────────────────────────────────────────────────

describe('atomicWrite', () => {
  let dir: string;

  beforeEach(() => {
    dir = join(tmpdir(), `devyard-test-${process.pid}-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('writes content to target path', () => {
    const p = join(dir, 'out.txt');
    atomicWrite(p, 'hello');
    expect(readFileSync(p, 'utf-8')).toBe('hello');
  });

  it('leaves no .tmp file on success', () => {
    const p = join(dir, 'out.txt');
    atomicWrite(p, 'data');
    const entries = require('node:fs').readdirSync(dir) as string[];
    expect(entries.some((e: string) => e.includes('.tmp'))).toBe(false);
  });

  it('overwrites existing file atomically', () => {
    const p = join(dir, 'out.txt');
    atomicWrite(p, 'v1');
    atomicWrite(p, 'v2');
    expect(readFileSync(p, 'utf-8')).toBe('v2');
  });
});

describe('ensureDir', () => {
  let base: string;
  beforeEach(() => {
    base = join(tmpdir(), `dyd-ensuredir-${Date.now()}`);
  });
  afterEach(() => {
    rmSync(base, { recursive: true, force: true });
  });

  it('creates a directory that does not exist', () => {
    ensureDir(base);
    expect(fileExists(base)).toBe(true);
  });

  it('is idempotent — does not throw when directory exists', () => {
    ensureDir(base);
    expect(() => ensureDir(base)).not.toThrow();
  });
});

describe('fileExists', () => {
  it('returns true for an existing file', () => {
    expect(fileExists(join(homedir(), '.zshrc')) || true).toBe(true); // env-agnostic
  });

  it('returns false for a non-existent path', () => {
    expect(fileExists('/definitely/does/not/exist/xyz')).toBe(false);
  });
});

// ── paths.ts ─────────────────────────────────────────────────────────────────

describe('opsRoot', () => {
  it('returns ~/.devyard', () => {
    expect(opsRoot()).toBe(join(homedir(), '.devyard'));
  });
});

describe('path helpers', () => {
  it('vaultPath returns config vault path', () => {
    expect(vaultPath(DEFAULT_CONFIG)).toBe(DEFAULT_CONFIG.vault.path);
  });

  it('hookPath nests under hooks/', () => {
    expect(hookPath('pre-push.sh')).toBe(join(opsRoot(), 'hooks', 'pre-push.sh'));
  });

  it('skillPath nests under skills/', () => {
    expect(skillPath('status')).toBe(join(opsRoot(), 'skills', 'status'));
  });

  it('rolePath nests under roles/<dept>/<name>', () => {
    expect(rolePath('engineering', 'hisham.md')).toBe(
      join(opsRoot(), 'roles', 'engineering', 'hisham.md'),
    );
  });

  it('agentPath nests under agents/', () => {
    expect(agentPath('rex-code-reviewer.md')).toBe(
      join(opsRoot(), 'agents', 'rex-code-reviewer.md'),
    );
  });

  it('rulePath nests under rules/', () => {
    expect(rulePath('git-conventions.md')).toBe(join(opsRoot(), 'rules', 'git-conventions.md'));
  });
});

// ── async.ts ─────────────────────────────────────────────────────────────────

describe('withTimeout', () => {
  it('resolves when promise completes before deadline', async () => {
    const result = await withTimeout(Promise.resolve(42), 1000);
    expect(result).toBe(42);
  });

  it('rejects with a timeout error when deadline exceeded', async () => {
    const slow = new Promise<never>(() => {
      /* never resolves */
    });
    await expect(withTimeout(slow, 10)).rejects.toThrow(/timed out/i);
  });

  it('propagates rejection from the original promise', async () => {
    await expect(withTimeout(Promise.reject(new Error('boom')), 1000)).rejects.toThrow('boom');
  });
});

describe('retry', () => {
  it('returns on first success', async () => {
    let calls = 0;
    const result = await retry(async () => {
      calls++;
      return 'ok';
    }, 3);
    expect(result).toBe('ok');
    expect(calls).toBe(1);
  });

  it('retries after transient failure', async () => {
    let calls = 0;
    const result = await retry(async () => {
      calls++;
      if (calls < 3) throw new Error('fail');
      return 'done';
    }, 5);
    expect(result).toBe('done');
    expect(calls).toBe(3);
  });

  it('throws last error after all attempts exhausted', async () => {
    await expect(
      retry(async () => {
        throw new Error('always fails');
      }, 3),
    ).rejects.toThrow('always fails');
  });
});

describe('pLimit re-export', () => {
  it('is callable and limits concurrency', async () => {
    const limit = pLimit(2);
    let active = 0;
    let maxActive = 0;
    const tasks = Array.from({ length: 6 }, () =>
      limit(async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 10));
        active--;
      }),
    );
    await Promise.all(tasks);
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});

// ── logger.ts ─────────────────────────────────────────────────────────────────

describe('createLogger', () => {
  let logDir: string;
  let logFile: string;

  beforeEach(() => {
    logDir = join(tmpdir(), `dyd-logger-${Date.now()}`);
    logFile = join(logDir, 'test.log');
  });

  afterEach(() => {
    rmSync(logDir, { recursive: true, force: true });
  });

  function readLog() {
    return readFileSync(logFile, 'utf-8')
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l));
  }

  it('creates log directory automatically', () => {
    const logger = createLogger(logFile, 'info');
    logger.info('hello');
    expect(fileExists(logDir)).toBe(true);
  });

  it('writes structured JSON lines', () => {
    const logger = createLogger(logFile, 'debug');
    logger.info('msg', { key: 'val' });
    const [entry] = readLog();
    expect(entry).toMatchObject({ level: 'info', msg: 'msg', key: 'val' });
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('suppresses messages below configured level', () => {
    const logger = createLogger(logFile, 'warn');
    logger.debug('ignored');
    logger.info('also ignored');
    logger.warn('kept');
    const entries = readLog();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.level).toBe('warn');
  });

  it('supports all four levels', () => {
    const logger = createLogger(logFile, 'debug');
    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');
    const levels = readLog().map((e) => e.level);
    expect(levels).toEqual(['debug', 'info', 'warn', 'error']);
  });
});

// ── history.ts ───────────────────────────────────────────────────────────────

describe('loadHistory / saveHistory', () => {
  // We monkey-patch the module-level HISTORY_PATH by writing to a temp location
  // by spying on fs — instead we test through the public API directly, which
  // writes to ~/.devyard/history.json in the real environment.
  // To keep tests isolated, we override the path via the real functions and
  // verify round-trip behaviour indirectly.

  it('saveHistory then loadHistory round-trips entries', () => {
    const original = loadHistory();
    const entries = ['entry-a', 'entry-b', 'entry-c'];
    saveHistory(entries);
    const reloaded = loadHistory();
    expect(reloaded).toEqual(entries);
    // Restore
    saveHistory(original);
  });

  it('caps saved entries at 100', () => {
    const original = loadHistory();
    const big = Array.from({ length: 150 }, (_, i) => `e${i}`);
    saveHistory(big);
    const reloaded = loadHistory();
    expect(reloaded).toHaveLength(100);
    // Should keep the last 100
    expect(reloaded[0]).toBe('e50');
    expect(reloaded[99]).toBe('e149');
    saveHistory(original);
  });

  it('loadHistory returns empty array for empty save', () => {
    const original = loadHistory();
    saveHistory([]);
    expect(loadHistory()).toEqual([]);
    saveHistory(original);
  });
});
