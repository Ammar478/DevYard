import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { ensureDir } from '../utils/fs.js';

const HISTORY_PATH = join(homedir(), '.devyard', 'history.json');
const MAX_ENTRIES = 100;

export function loadHistory(): string[] {
  try {
    const raw = readFileSync(HISTORY_PATH, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((e) => typeof e === 'string')) {
      return parsed as string[];
    }
  } catch {
    // missing or corrupted — fall through to recreate
  }
  saveHistory([]);
  return [];
}

export function saveHistory(entries: string[]): void {
  ensureDir(join(homedir(), '.devyard'));
  const capped = entries.slice(-MAX_ENTRIES);
  writeFileSync(HISTORY_PATH, JSON.stringify(capped), 'utf-8');
}
