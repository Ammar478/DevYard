import type { SkillDefinition } from '../skills/types.js';
import type { ProjectMatcher } from './matcher.js';

export type Action =
  | { kind: 'noop' }
  | { kind: 'navigate'; project: string }
  | { kind: 'launch-skill'; skill: SkillDefinition }
  | { kind: 'error'; message: string }
  | { kind: 'freeform-query'; text: string };

export interface DispatchContext {
  matcher: Pick<ProjectMatcher, 'match' | 'suggest'>;
  skills: { resolve(id: string): SkillDefinition | null };
}

export async function dispatch(input: string, ctx: DispatchContext): Promise<Action> {
  const t = input.trim();
  if (!t) return { kind: 'noop' };
  const project = ctx.matcher.match(t);
  if (project) return { kind: 'navigate', project };
  if (t.startsWith('/')) {
    const skill = ctx.skills.resolve(t.slice(1));
    if (skill) return { kind: 'launch-skill', skill };
    return { kind: 'error', message: `unknown skill: ${t}` };
  }
  return { kind: 'freeform-query', text: t };
}
