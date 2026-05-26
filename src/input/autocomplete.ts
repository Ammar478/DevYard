import type { ProjectMatcher } from './matcher.js';

export function getAutocompleteSuggestion(
  prefix: string,
  matcher: Pick<ProjectMatcher, 'suggest'>,
): string | null {
  const results = matcher.suggest(prefix);
  return results[0] ?? null;
}
