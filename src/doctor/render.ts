import { semantic } from '../theme/index.js';
import type { CheckReport, CheckResult } from './check.js';

function color(hex: string, text: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`;
}

function icon(result: CheckResult): string {
  switch (result.status) {
    case 'pass':
      return color(semantic.success, '✓');
    case 'warn':
      return color(semantic.warning, '!');
    case 'fail':
      return color(semantic.error, '✗');
  }
}

export function renderReport(report: CheckReport): void {
  const categories = new Map<string, CheckResult[]>();
  for (const result of report.results) {
    const group = categories.get(result.category) ?? [];
    group.push(result);
    categories.set(result.category, group);
  }

  for (const [category, results] of categories) {
    process.stdout.write(`\n${category.toUpperCase()}\n`);
    for (const result of results) {
      const msgPart = result.message ? `  ${result.message}` : '';
      process.stdout.write(`  ${icon(result)} ${result.label}${msgPart}\n`);
      if (result.status === 'fail' && result.remediation) {
        process.stdout.write(`    → ${result.remediation}\n`);
      }
    }
  }

  const summary = report.passed
    ? color(semantic.success, 'All required checks passed.')
    : color(semantic.error, 'One or more required checks failed.');
  process.stdout.write(`\n${summary}\n`);
}
