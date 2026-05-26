import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import pLimit from 'p-limit';
import type { Config } from '../config/types.js';
import { ProjectMatcher } from '../input/matcher.js';
import type { Logger } from '../utils/logger.js';
import { projectFrontmatterSchema } from './schemas.js';
import type { ProjectFrontmatter } from './types.js';

export interface ScanWarning {
  projectDir: string;
  reason: 'missing-readme' | 'invalid-yaml' | 'schema-failure';
  /** Comma-separated list of failing fields for schema-failure warnings. */
  fields?: string;
}

export interface ScannedProject {
  /** Directory name under Projects/ (used as the key). */
  dir: string;
  frontmatter: ProjectFrontmatter;
}

export interface ScanResult {
  projects: ScannedProject[];
  matcher: ProjectMatcher;
  warnings: ScanWarning[];
}

/**
 * Scans <vault>/Projects/*\/README.md in parallel (p-limit 16),
 * parses and validates frontmatter, builds a ProjectMatcher trie.
 */
export async function scanVault(config: Config, logger?: Logger): Promise<ScanResult> {
  const t0 = performance.now();
  const projectsRoot = join(config.vault.path, 'Projects');

  let dirs: string[] = [];
  try {
    dirs = readdirSync(projectsRoot, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    // Vault not yet initialised - return empty result.
    return { projects: [], matcher: new ProjectMatcher([]), warnings: [] };
  }

  const limit = pLimit(16);
  const results = await Promise.allSettled(
    dirs.map((dir) =>
      limit(async () => {
        const readmePath = join(projectsRoot, dir, 'README.md');
        let raw: string;
        try {
          raw = readFileSync(readmePath, 'utf-8');
        } catch {
          return { type: 'warn' as const, dir, reason: 'missing-readme' as const };
        }

        let parsed: Record<string, unknown>;
        try {
          parsed = matter(raw).data as Record<string, unknown>;
        } catch {
          return { type: 'warn' as const, dir, reason: 'invalid-yaml' as const };
        }

        const result = projectFrontmatterSchema.safeParse(parsed);
        if (!result.success) {
          const fields = result.error.issues.map((i) => i.path.join('.')).join(', ');
          return { type: 'warn' as const, dir, reason: 'schema-failure' as const, fields };
        }

        return { type: 'ok' as const, dir, frontmatter: result.data };
      }),
    ),
  );

  const projects: ScannedProject[] = [];
  const warnings: ScanWarning[] = [];

  for (const settled of results) {
    // Promise.allSettled only rejects if p-limit itself throws - treat as schema failure.
    if (settled.status === 'rejected') continue;
    const r = settled.value;
    if (r.type === 'ok') {
      projects.push({ dir: r.dir, frontmatter: r.frontmatter });
    } else {
      warnings.push({
        projectDir: r.dir,
        reason: r.reason,
        ...(r.fields !== undefined && { fields: r.fields }),
      });
    }
  }

  const matcher = new ProjectMatcher(projects.map((p) => p.frontmatter.name));
  const durationMs = +(performance.now() - t0).toFixed(2);
  logger?.debug('vault-scan-duration', { durationMs, projectCount: projects.length });
  return { projects, matcher, warnings };
}
