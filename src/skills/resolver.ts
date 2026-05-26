import { readFileSync } from 'node:fs';
import matter from 'gray-matter';
import { z } from 'zod';
import { skillPath } from '../utils/paths.js';
import type { SkillDefinition } from './types.js';

const skillSchema = z.object({
  id: z.string().min(1),
  role: z.string().min(1),
  description: z.string().min(1),
  usage: z.string().min(1),
});

export function resolveSkill(id: string): SkillDefinition | null {
  const mdPath = `${skillPath(id)}/SKILL.md`;
  let raw: string;
  try {
    raw = readFileSync(mdPath, 'utf-8');
  } catch {
    return null;
  }

  const { data } = matter(raw);
  const result = skillSchema.safeParse(data);
  if (!result.success) return null;

  return result.data;
}
