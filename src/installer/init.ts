import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Config } from '../config/types.js';
import { runDoctor } from '../doctor/check.js';
import { renderReport } from '../doctor/render.js';
import { copyTemplates } from './copy-templates.js';
import { installHooks } from './install-hooks.js';
import { installMcpServers } from './install-mcp-servers.js';
import { mergeClaudeSettings } from './merge-claude-settings.js';
import { scaffoldVault } from './scaffold-vault.js';
import { writeConfig } from './write-config.js';

const __filename = fileURLToPath(import.meta.url);
// dev: src/installer/init.ts — 2 levels up to project root
// bundle: dist/cli.js — 1 level up to project root
const projectRoot = __filename.includes('/src/installer/')
  ? join(dirname(__filename), '..', '..')
  : join(dirname(__filename), '..');
const assetsDir = join(projectRoot, 'assets');

export async function runInit(config: Config): Promise<void> {
  console.log('→ Scaffolding vault...');
  scaffoldVault(config.vault.path);

  console.log('→ Copying templates...');
  copyTemplates(config.vault.path, assetsDir);

  console.log('→ Writing config...');
  writeConfig();

  console.log('→ Installing hooks...');
  installHooks(assetsDir);

  console.log('→ Wiring Claude settings...');
  mergeClaudeSettings();

  console.log('→ Installing MCP servers...');
  installMcpServers();

  console.log('→ Running doctor...');
  const report = await runDoctor({ config });
  renderReport(report);

  if (!report.passed) {
    process.exit(1);
  }
}
