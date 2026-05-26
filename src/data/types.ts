/**
 * Vault frontmatter interfaces for all 14 DevYard entity types.
 *
 * All entities live in the Obsidian vault as markdown files with YAML
 * frontmatter. These TypeScript interfaces are the canonical type definitions;
 * Zod schemas in the same module validate at runtime.
 */

// ---------------------------------------------------------------------------
// 1. Project
// ---------------------------------------------------------------------------

export interface ProjectFrontmatter {
  name: string;
  type: 'project';
  status: 'created' | 'active' | 'parked' | 'archived';
  tier: 'P0' | 'P1' | 'P2';
  /** Git URLs */
  repos: string[];
  last_branch: string | null;
  last_ticket: string | null;
  last_session: string | null;
  stack: string[];
  /** ISO 8601 date */
  created: string;
  team: string | null;
}

// ---------------------------------------------------------------------------
// 2. BRD
// ---------------------------------------------------------------------------

export interface BrdFrontmatter {
  title: string;
  type: 'brd';
  /** Matches /^\d+\.\d+$/ */
  version: string;
  status: 'draft' | 'approved' | 'done';
  linked_tasks: string[];
  linked_mr: string | null;
  linked_idea: string | null;
  /** ISO 8601 date */
  created: string;
  approved_at: string | null;
  author: string;
}

// ---------------------------------------------------------------------------
// 3. Design
// ---------------------------------------------------------------------------

export interface DesignFrontmatter {
  title: string;
  type: 'design';
  version: string;
  status: 'draft' | 'approved' | 'done';
  /** Required — enforced by design-validator.sh */
  linked_brd: string;
  /** ISO 8601 date */
  created: string;
  approved_at: string | null;
}

// ---------------------------------------------------------------------------
// 4. AgDR (Agent Decision Record)
// ---------------------------------------------------------------------------

export interface AgdrFrontmatter {
  /** e.g. "AgDR-0042" */
  id: string;
  title: string;
  type: 'agdr';
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
  /** ISO 8601 date */
  date: string;
  supersedes: string | null;
  superseded_by: string | null;
  /** e.g. arch, security, data, infra */
  context_tags: string[];
  /** Single-line Y-statement summary */
  y_statement: string;
}

// ---------------------------------------------------------------------------
// 5. Tasks
// ---------------------------------------------------------------------------

export interface TasksFrontmatter {
  type: 'tasks';
  linked_brd: string;
  linked_design: string | null;
  /** ISO 8601 date */
  generated: string;
  count: number;
}

// ---------------------------------------------------------------------------
// 6. Session
// ---------------------------------------------------------------------------

export interface SessionFrontmatter {
  type: 'session';
  project: string;
  /** ISO 8601 date */
  date: string;
  ticket: string | null;
  branch: string | null;
  outcome: 'success' | 'blocked' | 'wip';
  role: string;
}

// ---------------------------------------------------------------------------
// 7. Idea
// ---------------------------------------------------------------------------

export interface IdeaFrontmatter {
  /** e.g. "IDEA-042" */
  id: string;
  title: string;
  type: 'idea';
  tags: string[];
  /** ISO 8601 date */
  created: string;
  verdict: 'GREEN' | 'YELLOW' | 'RED' | null;
  promoted_to: string | null;
  archived: boolean;
}

// ---------------------------------------------------------------------------
// 8. Handover
// ---------------------------------------------------------------------------

export interface HandoverFrontmatter {
  type: 'handover';
  project: string;
  /** ISO 8601 date */
  date: string;
  summary_of: string;
  next_owner: string | null;
  state_snapshot: {
    last_branch: string | null;
    last_ticket: string | null;
    open_decisions: string[];
    open_tasks: string[];
  };
}

// ---------------------------------------------------------------------------
// 9. Roadmap
// ---------------------------------------------------------------------------

export interface RoadmapFrontmatter {
  type: 'roadmap';
  project: string;
  /** ISO 8601 date */
  updated: string;
  audience: 'team' | 'leadership' | 'public';
}

// ---------------------------------------------------------------------------
// 10. Stakeholder Update
// ---------------------------------------------------------------------------

export interface StakeholderUpdateFrontmatter {
  type: 'stakeholder-update';
  audience: 'team' | 'leadership' | 'public' | 'launch';
  cadence: 'weekly' | 'monthly' | 'launch' | 'ad-hoc';
  /** null = portfolio rollup */
  project: string | null;
  /** ISO 8601 date */
  date: string;
  /** ISO 8601 date */
  period_start: string;
  /** ISO 8601 date */
  period_end: string;
}

// ---------------------------------------------------------------------------
// 11. Investigation
// ---------------------------------------------------------------------------

export interface InvestigationFrontmatter {
  /** e.g. "INV-007" */
  id: string;
  title: string;
  type: 'investigation';
  status: 'open' | 'follow-ups-filed' | 'closed';
  /** ISO 8601 date */
  opened: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  hypothesis_count: number;
  evidence_count: number;
}

// ---------------------------------------------------------------------------
// 12. Spike Memo
// ---------------------------------------------------------------------------

export interface SpikeMemoFrontmatter {
  id: string;
  title: string;
  type: 'spike-memo';
  disposition: 'PROMOTE' | 'DISCARD';
  hypothesis: string;
  budget_hours: number;
  actual_hours: number;
  kill_criteria_met: boolean;
  /** ISO 8601 date */
  closed: string;
}

// ---------------------------------------------------------------------------
// 13. Feature Inventory
// ---------------------------------------------------------------------------

export interface FeatureInventoryFrontmatter {
  type: 'feature-inventory';
  project: string;
  /** ISO 8601 date */
  generated: string;
  axes: (
    | 'http-routes'
    | 'data-models'
    | 'async-jobs'
    | 'test-names'
    | 'ui-screens'
    | 'documented-features'
  )[];
}

// ---------------------------------------------------------------------------
// 14. Audit Result
// ---------------------------------------------------------------------------

export interface AuditResultFrontmatter {
  type: 'audit';
  /** e.g. "launch-check" | "accessibility" | "compliance" */
  audit_name: string;
  project: string;
  /** ISO 8601 date */
  date: string;
  /** GO | GO_WITH_WARNINGS | CONDITIONAL_GO | NO_GO | custom string */
  verdict: 'GO' | 'GO_WITH_WARNINGS' | 'CONDITIONAL_GO' | 'NO_GO' | string;
  blocker_count: number;
  warning_count: number;
}

// ---------------------------------------------------------------------------
// Union type — covers all 14 entity types
// ---------------------------------------------------------------------------

export type AnyFrontmatter =
  | ProjectFrontmatter
  | BrdFrontmatter
  | DesignFrontmatter
  | AgdrFrontmatter
  | TasksFrontmatter
  | SessionFrontmatter
  | IdeaFrontmatter
  | HandoverFrontmatter
  | RoadmapFrontmatter
  | StakeholderUpdateFrontmatter
  | InvestigationFrontmatter
  | SpikeMemoFrontmatter
  | FeatureInventoryFrontmatter
  | AuditResultFrontmatter;

// ---------------------------------------------------------------------------
// Typed error classes
// ---------------------------------------------------------------------------

/**
 * Thrown by the Frontmatter_Module when a vault artifact fails schema
 * validation before a write. The `field` property identifies the first
 * failing field so callers can surface a precise error message.
 *
 * Validates: Requirements 8.11
 */
export class FrontmatterValidationError extends Error {
  readonly field: string;

  constructor(field: string, message?: string) {
    super(message ?? `Frontmatter validation failed on field: ${field}`);
    this.name = 'FrontmatterValidationError';
    this.field = field;
    // Maintain correct prototype chain in transpiled ES5 targets
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the MCP client cannot establish or maintain a connection to
 * the Obsidian MCP server.
 */
export class McpConnectionError extends Error {
  constructor(message?: string) {
    super(message ?? 'Failed to connect to the Obsidian MCP server');
    this.name = 'McpConnectionError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown by the skill resolver when a requested skill ID is not found in
 * the 49-skill registry.
 */
export class SkillNotFoundError extends Error {
  readonly skillId: string;

  constructor(skillId: string, message?: string) {
    super(message ?? `Skill not found: ${skillId}`);
    this.name = 'SkillNotFoundError';
    this.skillId = skillId;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
