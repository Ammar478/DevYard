import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { YAMLParseError, parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { DEFAULT_CONFIG } from './defaults.js';
import { type Config, ConfigValidationError } from './types.js';

const configSchema = z.object({
  vault: z.object({
    path: z.string(),
    obsidian_app: z.string().nullable(),
  }),
  ollama: z.object({
    url: z.string(),
    timeout_ms: z.number().int().positive(),
  }),
  claude: z.object({
    binary: z.string(),
    default_role: z.string(),
  }),
  mcp: z.object({
    obsidian: z.object({
      command: z.string(),
      args: z.array(z.string()),
      env: z.record(z.string()),
    }),
  }),
  ui: z.object({
    panel_widths: z.tuple([z.number(), z.number()]),
    show_parked_projects: z.boolean(),
    show_archived_projects: z.boolean(),
    spinner_style: z.enum(['dots', 'line', 'arc']),
  }),
  performance: z.object({
    cold_start_budget_ms: z.number().int().positive(),
    keystroke_budget_ms: z.number().int().positive(),
    vault_scan_budget_ms: z.number().int().positive(),
    hook_budget_ms: z.number().int().positive(),
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    path: z.string(),
  }),
  env: z.object({
    github_token_var: z.string(),
    gitlab_token_var: z.string(),
  }),
  portfolio: z.object({
    mode: z.enum(['single', 'split']),
    public_root: z.string().nullable(),
    private_root: z.string().nullable(),
  }),
});

function suggestion(field: string): string {
  const known: Record<string, string> = {
    'ollama.url': 'Set ollama.url to a valid URL, e.g. "http://localhost:11434".',
    'ollama.timeout_ms': 'Set ollama.timeout_ms to a positive integer in milliseconds.',
    'ui.panel_widths': 'Set ui.panel_widths to a two-element array, e.g. [30, 70].',
    'ui.spinner_style': 'Set ui.spinner_style to one of: dots, line, arc.',
    'logging.level': 'Set logging.level to one of: debug, info, warn, error.',
    'portfolio.mode': 'Set portfolio.mode to one of: single, split.',
    'portfolio.public_root':
      'Set portfolio.public_root to the absolute path of your public vault root.',
    'portfolio.private_root':
      'Set portfolio.private_root to the absolute path of your private vault root.',
  };
  return known[field] ?? `Check the value for "${field}" in ~/.devyard/config.yaml.`;
}

// Recursively merges override into base; arrays are replaced, not merged.
function deepMerge<T extends object>(base: T, override: unknown): T {
  if (typeof override !== 'object' || override === null) return base;
  const result = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const baseVal = result[key];
    if (
      typeof baseVal === 'object' &&
      baseVal !== null &&
      !Array.isArray(baseVal) &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      result[key] = deepMerge(baseVal as object, value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

/**
 * Reads ~/.devyard/config.yaml, merges with defaults, validates with Zod.
 * Accepts an optional path override for testing.
 */
export function readConfig(configPath?: string): Config {
  const path = configPath ?? join(homedir(), '.devyard', 'config.yaml');

  let raw: string;
  try {
    raw = readFileSync(path, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return structuredClone(DEFAULT_CONFIG) as Config;
    }
    throw err;
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(raw);
  } catch (err) {
    if (err instanceof YAMLParseError) {
      throw new ConfigValidationError(
        'yaml',
        'Ensure the file is valid YAML. Check for incorrect indentation or special characters.',
        `Invalid YAML in config: ${err.message}`,
      );
    }
    throw err;
  }

  // Null YAML (empty file) → use defaults
  if (parsed === null || parsed === undefined) {
    return structuredClone(DEFAULT_CONFIG) as Config;
  }

  const merged = deepMerge(DEFAULT_CONFIG, parsed);
  const result = configSchema.safeParse(merged);

  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue ? issue.path.join('.') : 'config';
    const msg = issue?.message ?? 'Config validation failed.';
    throw new ConfigValidationError(field, suggestion(field), msg);
  }

  const config = result.data;

  if (config.portfolio.mode === 'split') {
    if (!config.portfolio.public_root) {
      throw new ConfigValidationError('portfolio.public_root', suggestion('portfolio.public_root'));
    }
    if (!config.portfolio.private_root) {
      throw new ConfigValidationError(
        'portfolio.private_root',
        suggestion('portfolio.private_root'),
      );
    }
  }

  return config;
}
