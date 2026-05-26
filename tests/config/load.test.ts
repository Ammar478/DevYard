import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../../src/config/defaults.js';
import { readConfig } from '../../src/config/load.js';
import { ConfigValidationError } from '../../src/config/types.js';

const tmp = join(tmpdir(), `devyard-test-${process.pid}`);
const configPath = join(tmp, 'config.yaml');

beforeEach(() => mkdirSync(tmp, { recursive: true }));
afterEach(() => rmSync(tmp, { recursive: true, force: true }));

function write(content: string) {
  writeFileSync(configPath, content, 'utf-8');
}

describe('readConfig', () => {
  it('returns defaults when config file is missing', () => {
    const config = readConfig(join(tmp, 'nonexistent.yaml'));
    expect(config.ollama.url).toBe(DEFAULT_CONFIG.ollama.url);
    expect(config.claude.binary).toBe(DEFAULT_CONFIG.claude.binary);
    expect(config.portfolio.mode).toBe('single');
  });

  it('returns defaults when config file is empty', () => {
    write('');
    const config = readConfig(configPath);
    expect(config.ollama.timeout_ms).toBe(DEFAULT_CONFIG.ollama.timeout_ms);
  });

  it('merges partial config with defaults', () => {
    write(`
ollama:
  url: http://custom-host:11434
`);
    const config = readConfig(configPath);
    expect(config.ollama.url).toBe('http://custom-host:11434');
    // Unspecified fields still get defaults
    expect(config.ollama.timeout_ms).toBe(DEFAULT_CONFIG.ollama.timeout_ms);
    expect(config.claude.binary).toBe(DEFAULT_CONFIG.claude.binary);
  });

  it('loads a fully valid config', () => {
    write(`
vault:
  path: /home/user/vault
  obsidian_app: /Applications/Obsidian.app
ollama:
  url: http://localhost:11434
  timeout_ms: 2000
claude:
  binary: claude
  default_role: khalid
mcp:
  obsidian:
    command: npx
    args: ["-y", "obsidian-mcp-server"]
    env: {}
ui:
  panel_widths: [40, 60]
  show_parked_projects: true
  show_archived_projects: false
  spinner_style: line
performance:
  cold_start_budget_ms: 500
  keystroke_budget_ms: 50
  vault_scan_budget_ms: 100
  hook_budget_ms: 200
logging:
  level: debug
  path: /tmp/devyard.log
env:
  github_token_var: GH_TOKEN
  gitlab_token_var: GL_TOKEN
portfolio:
  mode: single
  public_root: null
  private_root: null
`);
    const config = readConfig(configPath);
    expect(config.vault.path).toBe('/home/user/vault');
    expect(config.ui.panel_widths).toEqual([40, 60]);
    expect(config.ui.spinner_style).toBe('line');
    expect(config.logging.level).toBe('debug');
    expect(config.claude.default_role).toBe('khalid');
  });

  it('throws ConfigValidationError with field "yaml" on malformed YAML', () => {
    write(`
vault:
  path: valid
  bad: [unclosed
`);
    expect(() => readConfig(configPath)).toThrow(ConfigValidationError);
    try {
      readConfig(configPath);
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigValidationError);
      expect((err as ConfigValidationError).field).toBe('yaml');
    }
  });

  it('throws ConfigValidationError identifying the failing field on schema violation', () => {
    write(`
ollama:
  timeout_ms: not-a-number
`);
    expect(() => readConfig(configPath)).toThrow(ConfigValidationError);
    try {
      readConfig(configPath);
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigValidationError);
      expect((err as ConfigValidationError).field).toMatch(/ollama/);
    }
  });

  it('throws ConfigValidationError for split mode with missing public_root', () => {
    write(`
portfolio:
  mode: split
  public_root: null
  private_root: /home/user/private
`);
    expect(() => readConfig(configPath)).toThrow(ConfigValidationError);
    try {
      readConfig(configPath);
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigValidationError);
      expect((err as ConfigValidationError).field).toBe('portfolio.public_root');
    }
  });

  it('throws ConfigValidationError for split mode with missing private_root', () => {
    write(`
portfolio:
  mode: split
  public_root: /home/user/public
  private_root: null
`);
    expect(() => readConfig(configPath)).toThrow(ConfigValidationError);
    try {
      readConfig(configPath);
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigValidationError);
      expect((err as ConfigValidationError).field).toBe('portfolio.private_root');
    }
  });

  it('accepts split mode when both roots are provided', () => {
    write(`
portfolio:
  mode: split
  public_root: /home/user/public
  private_root: /home/user/private
`);
    const config = readConfig(configPath);
    expect(config.portfolio.mode).toBe('split');
    expect(config.portfolio.public_root).toBe('/home/user/public');
    expect(config.portfolio.private_root).toBe('/home/user/private');
  });

  it('ignores unknown token-like fields in config file (tokens come from env vars only)', () => {
    write(`
vault:
  path: /home/user/vault
github_token: ghp_shouldbeignored
GITLAB_TOKEN: also_ignored
`);
    // Should load without error — token fields are not in the schema
    const config = readConfig(configPath);
    expect(config.vault.path).toBe('/home/user/vault');
    expect(config).not.toHaveProperty('github_token');
    expect(config).not.toHaveProperty('GITLAB_TOKEN');
  });
});
