export interface IdeaSummary {
  path: string;
  title: string;
  /** ISO 8601 modification timestamp */
  modified: string;
  tags: string[];
}

export type McpStatus = 'connected' | 'disconnected' | 'connecting';

export interface McpConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
}
