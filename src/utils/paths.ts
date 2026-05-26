import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Config } from '../config/types.js';

export function opsRoot(): string {
  return join(homedir(), '.devyard');
}

export function vaultPath(config: Config): string {
  return config.vault.path;
}

export function hookPath(name: string): string {
  return join(opsRoot(), 'hooks', name);
}

export function skillPath(id: string): string {
  return join(opsRoot(), 'skills', id);
}

export function rolePath(dept: string, name: string): string {
  return join(opsRoot(), 'roles', dept, name);
}

export function agentPath(name: string): string {
  return join(opsRoot(), 'agents', name);
}

export function rulePath(name: string): string {
  return join(opsRoot(), 'rules', name);
}
