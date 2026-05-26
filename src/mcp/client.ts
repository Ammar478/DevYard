import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { McpConnectionError } from '../data/types.js';
import type { McpConfig } from './types.js';

const CONNECT_TIMEOUT_MS = 2000;

export class ObsidianMcpClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;

  /**
   * Spawns the MCP stdio subprocess and connects within 2 seconds.
   * Throws McpConnectionError if the timeout expires.
   */
  async connect(config: McpConfig): Promise<void> {
    this.transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: { ...process.env, ...config.env } as Record<string, string>,
    });

    this.client = new Client({ name: 'devyard', version: '1.0.0' }, { capabilities: {} });

    const connectPromise = this.client.connect(this.transport);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new McpConnectionError('MCP connect timed out after 2s')),
        CONNECT_TIMEOUT_MS,
      ),
    );

    try {
      await Promise.race([connectPromise, timeoutPromise]);
    } catch (err) {
      this.client = null;
      this.transport = null;
      if (err instanceof McpConnectionError) throw err;
      throw new McpConnectionError(`MCP connect failed: ${(err as Error).message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.transport = null;
    }
  }

  /**
   * Calls an MCP tool by name with the given arguments.
   * Throws McpConnectionError with message "MCP not connected" if called before connect().
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.client) {
      throw new McpConnectionError('MCP not connected');
    }
    const result = await this.client.callTool({ name, arguments: args });
    return result;
  }

  get isConnected(): boolean {
    return this.client !== null;
  }
}
