import { z } from 'zod';

// ---------------------------------------------------------------------------
// 1. Project
// ---------------------------------------------------------------------------

export const projectFrontmatterSchema = z.object({
  name: z.string(),
  type: z.literal('project'),
  status: z.enum(['created', 'active', 'parked', 'archived']),
  tier: z.enum(['P0', 'P1', 'P2']),
  repos: z.array(z.string()),
  last_branch: z.string().nullable(),
  last_ticket: z.string().nullable(),
  last_session: z.string().nullable(),
  stack: z.array(z.string()),
  created: z.string(),
  team: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// 2. BRD
// ---------------------------------------------------------------------------

export const brdFrontmatterSchema = z.object({
  title: z.string(),
  type: z.literal('brd'),
  version: z.string().regex(/^\d+\.\d+$/),
  status: z.enum(['draft', 'approved', 'done']),
  linked_tasks: z.array(z.string()),
  linked_mr: z.string().nullable(),
  linked_idea: z.string().nullable(),
  created: z.string(),
  approved_at: z.string().nullable(),
  author: z.string(),
});

// ---------------------------------------------------------------------------
// 3. Design
// ---------------------------------------------------------------------------

export const designFrontmatterSchema = z.object({
  title: z.string(),
  type: z.literal('design'),
  version: z.string(),
  status: z.enum(['draft', 'approved', 'done']),
  linked_brd: z.string(),
  created: z.string(),
  approved_at: z.string().nullable(),
});

// ---------------------------------------------------------------------------
// 4. AgDR
// ---------------------------------------------------------------------------

export const agdrFrontmatterSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.literal('agdr'),
  status: z.enum(['proposed', 'accepted', 'deprecated', 'superseded']),
  date: z.string(),
  supersedes: z.string().nullable(),
  superseded_by: z.string().nullable(),
  context_tags: z.array(z.string()),
  y_statement: z.string(),
});

// ---------------------------------------------------------------------------
// 5. Tasks
// ---------------------------------------------------------------------------

export const tasksFrontmatterSchema = z.object({
  type: z.literal('tasks'),
  linked_brd: z.string(),
  linked_design: z.string().nullable(),
  generated: z.string(),
  count: z.number().int().nonnegative(),
});

// ---------------------------------------------------------------------------
// 6. Session
// ---------------------------------------------------------------------------

export const sessionFrontmatterSchema = z.object({
  type: z.literal('session'),
  project: z.string(),
  date: z.string(),
  ticket: z.string().nullable(),
  branch: z.string().nullable(),
  outcome: z.enum(['success', 'blocked', 'wip']),
  role: z.string(),
});

// ---------------------------------------------------------------------------
// 7. Idea
// ---------------------------------------------------------------------------

export const ideaFrontmatterSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.literal('idea'),
  tags: z.array(z.string()),
  created: z.string(),
  verdict: z.enum(['GREEN', 'YELLOW', 'RED']).nullable(),
  promoted_to: z.string().nullable(),
  archived: z.boolean(),
});

// ---------------------------------------------------------------------------
// 8. Handover
// ---------------------------------------------------------------------------

export const handoverFrontmatterSchema = z.object({
  type: z.literal('handover'),
  project: z.string(),
  date: z.string(),
  summary_of: z.string(),
  next_owner: z.string().nullable(),
  state_snapshot: z.object({
    last_branch: z.string().nullable(),
    last_ticket: z.string().nullable(),
    open_decisions: z.array(z.string()),
    open_tasks: z.array(z.string()),
  }),
});

// ---------------------------------------------------------------------------
// 9. Roadmap
// ---------------------------------------------------------------------------

export const roadmapFrontmatterSchema = z.object({
  type: z.literal('roadmap'),
  project: z.string(),
  updated: z.string(),
  audience: z.enum(['team', 'leadership', 'public']),
});

// ---------------------------------------------------------------------------
// 10. Stakeholder Update
// ---------------------------------------------------------------------------

export const stakeholderUpdateFrontmatterSchema = z.object({
  type: z.literal('stakeholder-update'),
  audience: z.enum(['team', 'leadership', 'public', 'launch']),
  cadence: z.enum(['weekly', 'monthly', 'launch', 'ad-hoc']),
  project: z.string().nullable(),
  date: z.string(),
  period_start: z.string(),
  period_end: z.string(),
});

// ---------------------------------------------------------------------------
// 11. Investigation
// ---------------------------------------------------------------------------

export const investigationFrontmatterSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.literal('investigation'),
  status: z.enum(['open', 'follow-ups-filed', 'closed']),
  opened: z.string(),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  hypothesis_count: z.number().int().nonnegative(),
  evidence_count: z.number().int().nonnegative(),
});

// ---------------------------------------------------------------------------
// 12. Spike Memo
// ---------------------------------------------------------------------------

export const spikeMemoFrontmatterSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.literal('spike-memo'),
  disposition: z.enum(['PROMOTE', 'DISCARD']),
  hypothesis: z.string(),
  budget_hours: z.number().positive(),
  actual_hours: z.number().nonnegative(),
  kill_criteria_met: z.boolean(),
  closed: z.string(),
});

// ---------------------------------------------------------------------------
// 13. Feature Inventory
// ---------------------------------------------------------------------------

export const featureInventoryFrontmatterSchema = z.object({
  type: z.literal('feature-inventory'),
  project: z.string(),
  generated: z.string(),
  axes: z.array(
    z.enum([
      'http-routes',
      'data-models',
      'async-jobs',
      'test-names',
      'ui-screens',
      'documented-features',
    ]),
  ),
});

// ---------------------------------------------------------------------------
// 14. Audit Result
// ---------------------------------------------------------------------------

export const auditResultFrontmatterSchema = z.object({
  type: z.literal('audit'),
  audit_name: z.string(),
  project: z.string(),
  date: z.string(),
  verdict: z.union([z.enum(['GO', 'GO_WITH_WARNINGS', 'CONDITIONAL_GO', 'NO_GO']), z.string()]),
  blocker_count: z.number().int().nonnegative(),
  warning_count: z.number().int().nonnegative(),
});

// ---------------------------------------------------------------------------
// Schema map — keyed by frontmatter `type` field
// ---------------------------------------------------------------------------

export const schemaByType = {
  project: projectFrontmatterSchema,
  brd: brdFrontmatterSchema,
  design: designFrontmatterSchema,
  agdr: agdrFrontmatterSchema,
  tasks: tasksFrontmatterSchema,
  session: sessionFrontmatterSchema,
  idea: ideaFrontmatterSchema,
  handover: handoverFrontmatterSchema,
  roadmap: roadmapFrontmatterSchema,
  'stakeholder-update': stakeholderUpdateFrontmatterSchema,
  investigation: investigationFrontmatterSchema,
  'spike-memo': spikeMemoFrontmatterSchema,
  'feature-inventory': featureInventoryFrontmatterSchema,
  audit: auditResultFrontmatterSchema,
} as const;
