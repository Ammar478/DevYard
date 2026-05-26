import type { Config } from '../config/types.js';
import { pLimit, withTimeout } from '../utils/async.js';

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface CheckResult {
  id: string;
  category: string;
  label: string;
  status: CheckStatus;
  message?: string;
  remediation?: string;
  required: boolean;
}

export interface CheckReport {
  results: CheckResult[];
  passed: boolean;
}

export interface DoctorContext {
  config: Config;
}

export interface DoctorOptions {
  hooksDeep?: boolean;
}

export interface Check {
  id: string;
  category: string;
  label: string;
  required: boolean;
  run(ctx: DoctorContext): Promise<{ status: CheckStatus; message?: string; remediation?: string }>;
}

export async function runDoctor(
  ctx: DoctorContext,
  opts: DoctorOptions = {},
): Promise<CheckReport> {
  const { allChecks } = await import('./checks/index.js');
  let checks: Check[] = [...allChecks];

  if (opts.hooksDeep) {
    const { deepChecks } = await import('./hooks-deep/index.js');
    checks = [...checks, ...deepChecks];
  }

  const limit = pLimit(checks.length);

  const results = await Promise.all(
    checks.map((check) =>
      limit(async () => {
        try {
          const outcome = await withTimeout(check.run(ctx), 2000);
          const result: CheckResult = {
            id: check.id,
            category: check.category,
            label: check.label,
            required: check.required,
            status: outcome.status,
          };
          if (outcome.message !== undefined) result.message = outcome.message;
          if (outcome.remediation !== undefined) result.remediation = outcome.remediation;
          return result;
        } catch {
          return {
            id: check.id,
            category: check.category,
            label: check.label,
            required: check.required,
            status: 'fail' as const,
            message: 'Check timed out after 2s',
          } satisfies CheckResult;
        }
      }),
    ),
  );

  const passed = results.every((r) => !r.required || r.status !== 'fail');

  return { results, passed };
}
