import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ObsidianMcpClient } from '../../mcp/client.js';
import { withTimeout } from '../../utils/async.js';
import type { Check } from '../check.js';

const execFileAsync = promisify(execFile);

export const integrationChecks: Check[] = [
  {
    id: 'integration-mcp-installed',
    category: 'integration',
    label: 'Obsidian MCP server installable',
    required: true,
    async run() {
      try {
        // npm show queries registry without starting the server (which requires env vars)
        await execFileAsync('npm', ['show', 'obsidian-mcp-server', 'version'], {
          timeout: 1800,
        });
        return { status: 'pass' };
      } catch {
        return {
          status: 'fail',
          message: 'obsidian-mcp-server could not be installed or run',
          remediation: 'Ensure npx is available and internet is reachable.',
        };
      }
    },
  },
  {
    id: 'integration-mcp-reachable',
    category: 'integration',
    label: 'MCP server responds within 2s',
    required: true,
    async run(ctx) {
      const mcpClient = new ObsidianMcpClient();
      try {
        await withTimeout(mcpClient.connect(ctx.config.mcp.obsidian), 2000);
        await mcpClient.disconnect();
        return { status: 'pass' };
      } catch {
        try {
          await mcpClient.disconnect();
        } catch {
          // ignore disconnect errors
        }
        return {
          status: 'fail',
          message: 'MCP not reachable within 2s',
        };
      }
    },
  },
  {
    id: 'integration-ollama',
    category: 'integration',
    label: 'Ollama API responding',
    required: true,
    async run(ctx) {
      const url = ctx.config.ollama.url;
      try {
        const response = await fetch(`${url}/api/tags`, {
          signal: AbortSignal.timeout(ctx.config.ollama.timeout_ms),
        });
        if (response.status === 200) {
          return { status: 'pass' };
        }
        return {
          status: 'fail',
          message: `Ollama returned status ${response.status} at ${url}`,
          remediation: 'Start Ollama: open Ollama.app or run ollama serve',
        };
      } catch {
        return {
          status: 'fail',
          message: `Ollama unreachable at ${url}`,
          remediation: 'Start Ollama: open Ollama.app or run ollama serve',
        };
      }
    },
  },
  {
    id: 'integration-gitlab-token',
    category: 'integration',
    label: 'GitLab token set',
    required: false,
    async run(ctx) {
      const tokenVar = ctx.config.env.gitlab_token_var;
      if (process.env[tokenVar]) {
        return { status: 'pass' };
      }
      return {
        status: 'warn',
        message: 'GitLab token not set. Some features may be unavailable.',
        remediation: `export ${tokenVar}=your_token`,
      };
    },
  },
];
