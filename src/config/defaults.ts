import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Config } from './types.js';

export const DEFAULT_CONFIG: Config = {
  vault: {
    path: join(homedir(), 'Documents', 'DevYard-Vault'),
    obsidian_app: '/Applications/Obsidian.app',
  },
  ollama: {
    url: 'http://localhost:11434',
    timeout_ms: 1000,
  },
  claude: {
    binary: 'claude',
    default_role: 'hisham',
  },
  mcp: {
    obsidian: {
      command: 'npx',
      args: ['-y', 'obsidian-mcp-server'],
      env: {},
    },
  },
  ui: {
    panel_widths: [30, 70],
    show_parked_projects: false,
    show_archived_projects: false,
    spinner_style: 'dots',
  },
  performance: {
    cold_start_budget_ms: 500,
    keystroke_budget_ms: 50,
    vault_scan_budget_ms: 100,
    hook_budget_ms: 200,
  },
  logging: {
    level: 'info',
    path: join(homedir(), '.devyard', 'logs', 'devyard.log'),
  },
  env: {
    github_token_var: 'GITHUB_TOKEN',
    gitlab_token_var: 'GITLAB_TOKEN',
  },
  portfolio: {
    mode: 'single',
    public_root: null,
    private_root: null,
  },
};
