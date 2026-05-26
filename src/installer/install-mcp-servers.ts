import { spawnSync } from 'node:child_process';

export function installMcpServers(): void {
  // npm show queries the registry without starting the server (which requires env vars)
  const result = spawnSync('npm', ['show', 'obsidian-mcp-server', 'version'], {
    stdio: 'inherit',
    timeout: 30000,
  });

  if (result.status === 0) {
    console.log('  mcp: obsidian-mcp-server installed');
  } else {
    console.log(`  mcp: installation failed (status ${String(result.status)})`);
  }
}
