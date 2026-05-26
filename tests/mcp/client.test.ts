import { beforeEach, describe, expect, it, vi } from 'vitest';
import { McpConnectionError } from '../../src/data/types.js';
import { ObsidianMcpClient } from '../../src/mcp/client.js';

// ---------------------------------------------------------------------------
// Mock the MCP SDK so tests never spawn real subprocesses
// ---------------------------------------------------------------------------

vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn(),
}));

vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
  StdioClientTransport: vi.fn(),
}));

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const MockClient = vi.mocked(Client);
const MockTransport = vi.mocked(StdioClientTransport);

const validConfig = {
  command: 'npx',
  args: ['-y', 'obsidian-mcp-server'],
  env: {},
};

function makeClientMock(opts: { connectDelay?: number; connectRejects?: boolean } = {}) {
  const mockInstance = {
    connect: vi.fn(async () => {
      if (opts.connectDelay) {
        await new Promise((r) => setTimeout(r, opts.connectDelay));
      }
      if (opts.connectRejects) throw new Error('connection refused');
    }),
    close: vi.fn(async () => {}),
    callTool: vi.fn(async () => ({ result: 'ok' })),
  };
  MockClient.mockImplementation(() => mockInstance as never);
  return mockInstance;
}

beforeEach(() => {
  vi.clearAllMocks();
  MockTransport.mockImplementation(() => ({}) as never);
});

describe('ObsidianMcpClient', () => {
  it('connects successfully when SDK resolves within 2s', async () => {
    makeClientMock();
    const client = new ObsidianMcpClient();
    await expect(client.connect(validConfig)).resolves.toBeUndefined();
    expect(client.isConnected).toBe(true);
  });

  it('throws McpConnectionError with timeout message when connect takes >2s', async () => {
    makeClientMock({ connectDelay: 2100 });
    const client = new ObsidianMcpClient();
    const err = await client.connect(validConfig).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(McpConnectionError);
    expect((err as McpConnectionError).message).toMatch(/timed out/i);
    expect(client.isConnected).toBe(false);
  }, 10_000);

  it('throws McpConnectionError when SDK connect rejects', async () => {
    makeClientMock({ connectRejects: true });
    const client = new ObsidianMcpClient();
    await expect(client.connect(validConfig)).rejects.toThrow(McpConnectionError);
    expect(client.isConnected).toBe(false);
  });

  it('throws McpConnectionError "MCP not connected" when callTool called before connect', async () => {
    const client = new ObsidianMcpClient();
    await expect(client.callTool('any_tool', {})).rejects.toThrow(McpConnectionError);
    await expect(client.callTool('any_tool', {})).rejects.toThrow('MCP not connected');
  });

  it('calls the underlying SDK callTool when connected', async () => {
    const mock = makeClientMock();
    const client = new ObsidianMcpClient();
    await client.connect(validConfig);
    await client.callTool('obsidian_get_recent_changes', { directory: 'Ideas' });
    expect(mock.callTool).toHaveBeenCalledWith({
      name: 'obsidian_get_recent_changes',
      arguments: { directory: 'Ideas' },
    });
  });

  it('disconnect closes the subprocess and marks client as disconnected', async () => {
    const mock = makeClientMock();
    const client = new ObsidianMcpClient();
    await client.connect(validConfig);
    expect(client.isConnected).toBe(true);
    await client.disconnect();
    expect(mock.close).toHaveBeenCalledOnce();
    expect(client.isConnected).toBe(false);
  });

  it('disconnect is safe to call when not connected', async () => {
    const client = new ObsidianMcpClient();
    await expect(client.disconnect()).resolves.toBeUndefined();
  });
});
