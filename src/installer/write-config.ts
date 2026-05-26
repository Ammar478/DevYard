import { writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { DEFAULT_CONFIG } from '../config/defaults.js';
import { readConfig } from '../config/load.js';
import { ensureDir } from '../utils/fs.js';

export function writeConfig(): void {
  const configPath = join(homedir(), '.devyard', 'config.yaml');
  try {
    readConfig(configPath);
    console.log('  config: already valid, skipping');
    return;
  } catch {
    // fall through to write
  }
  ensureDir(join(homedir(), '.devyard'));
  writeFileSync(configPath, stringify(DEFAULT_CONFIG), 'utf-8');
  console.log('  config: written ~/.devyard/config.yaml');
}
