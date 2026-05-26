/**
 * Configuration schema for DevYard.
 * Loaded from ~/.devyard/config.yaml at startup.
 */
export interface Config {
  vault: {
    /** Absolute path to the Obsidian vault. Default: ~/Documents/DevYard-Vault */
    path: string;
    /** Path to the Obsidian.app bundle, or null if not installed. Default: /Applications/Obsidian.app */
    obsidian_app: string | null;
  };
  ollama: {
    /** Base URL for the Ollama HTTP API. Default: http://localhost:11434 */
    url: string;
    /** Timeout in milliseconds for Ollama health checks. Default: 1000 */
    timeout_ms: number;
  };
  claude: {
    /** Name or path of the Claude Code binary. Default: claude */
    binary: string;
    /** Default role name loaded when no skill-specific role is declared. Default: hisham */
    default_role: string;
  };
  mcp: {
    obsidian: {
      /** Command used to launch the Obsidian MCP server. Default: npx */
      command: string;
      /** Arguments passed to the MCP server command. Default: ["-y", "obsidian-mcp-server"] */
      args: string[];
      /** Environment variables injected into the MCP server process (e.g. OBSIDIAN_VAULT_PATH). */
      env: Record<string, string>;
    };
  };
  ui: {
    /** Left and right panel width percentages. Must sum to 100. Default: [30, 70] */
    panel_widths: [number, number];
    /** Whether to show projects with status "parked" in the Projects panel. Default: false */
    show_parked_projects: boolean;
    /** Whether to show projects with status "archived" in the Projects panel. Default: false */
    show_archived_projects: boolean;
    /** Spinner animation style. Default: dots */
    spinner_style: 'dots' | 'line' | 'arc';
  };
  performance: {
    /** Maximum allowed time from process start to first TUI paint, in ms. Default: 500 */
    cold_start_budget_ms: number;
    /** Maximum allowed time to process a single keystroke, in ms. Default: 50 */
    keystroke_budget_ms: number;
    /** Maximum allowed time for the vault scan to complete, in ms. Default: 100 */
    vault_scan_budget_ms: number;
    /** Maximum allowed time for a single hook to execute, in ms. Default: 200 */
    hook_budget_ms: number;
  };
  logging: {
    /** Minimum log level to emit. Default: info */
    level: 'debug' | 'info' | 'warn' | 'error';
    /** Absolute path to the log file. Default: ~/.devyard/logs/devyard.log */
    path: string;
  };
  env: {
    /** Name of the environment variable that holds the GitHub personal access token. Default: GITHUB_TOKEN */
    github_token_var: string;
    /** Name of the environment variable that holds the GitLab personal access token. Default: GITLAB_TOKEN */
    gitlab_token_var: string;
  };
  portfolio: {
    /**
     * Portfolio layout mode.
     * - "single": all projects live in one vault/repo.
     * - "split": public and private projects are separated into two roots.
     * Default: single
     */
    mode: 'single' | 'split';
    /** Absolute path to the public portfolio root. Required when mode is "split". */
    public_root: string | null;
    /** Absolute path to the private portfolio root. Required when mode is "split". */
    private_root: string | null;
  };
}

/**
 * Typed error thrown when config validation fails.
 * Carries the offending field path and a human-readable remediation suggestion.
 */
export class ConfigValidationError extends Error {
  /** Dot-separated path to the invalid config field (e.g. "vault.path"). */
  readonly field: string;
  /** Human-readable suggestion for how to fix the invalid value. */
  readonly suggestion: string;

  constructor(field: string, suggestion: string, message?: string) {
    super(message ?? `Config validation failed for field "${field}": ${suggestion}`);
    this.name = 'ConfigValidationError';
    this.field = field;
    this.suggestion = suggestion;

    // Restore prototype chain for instanceof checks in transpiled ES5 targets.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
