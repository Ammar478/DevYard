import { readFileSync } from 'node:fs';
import matter from 'gray-matter';
import { atomicWrite } from '../utils/fs.js';
import { projectFrontmatterSchema, schemaByType } from './schemas.js';
import {
  type AnyFrontmatter,
  FrontmatterValidationError,
  type ProjectFrontmatter,
} from './types.js';

/**
 * Reads and validates a vault markdown file's frontmatter.
 * Throws FrontmatterValidationError if the `type` field is unknown or
 * if any required field is missing or has the wrong type.
 */
export function readFrontmatter(filePath: string): AnyFrontmatter {
  const raw = readFileSync(filePath, 'utf-8');
  const { data } = matter(raw);

  const type = (data as Record<string, unknown>).type as string | undefined;
  if (!type || !(type in schemaByType)) {
    throw new FrontmatterValidationError(
      'type',
      `Unknown or missing frontmatter type: "${type ?? '(none)'}"`,
    );
  }

  const schema = schemaByType[type as keyof typeof schemaByType];
  const result = schema.safeParse(data);

  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue ? issue.path.join('.') : 'unknown';
    throw new FrontmatterValidationError(field, issue?.message);
  }

  return result.data as AnyFrontmatter;
}

/**
 * Merges `update` fields into a project README's frontmatter, validates the
 * result against the project schema, then writes atomically.
 * Throws FrontmatterValidationError if validation fails — never writes invalid data.
 */
export function updateProjectFrontmatter(
  filePath: string,
  update: Partial<ProjectFrontmatter>,
): void {
  const raw = readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  const merged = { ...data, ...update };
  const result = projectFrontmatterSchema.safeParse(merged);

  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue ? issue.path.join('.') : 'unknown';
    throw new FrontmatterValidationError(field, issue?.message);
  }

  atomicWrite(filePath, matter.stringify(content, result.data));
}

/**
 * Serializes a frontmatter object + optional body to a markdown string
 * and writes it atomically. Validates against the appropriate schema first.
 * Throws FrontmatterValidationError if validation fails.
 */
export function writeFrontmatter(filePath: string, data: AnyFrontmatter, body = ''): void {
  const type = (data as unknown as Record<string, unknown>).type as string | undefined;
  if (!type || !(type in schemaByType)) {
    throw new FrontmatterValidationError('type', `Unknown frontmatter type: "${type ?? '(none)'}"`);
  }

  const schema = schemaByType[type as keyof typeof schemaByType];
  const result = schema.safeParse(data);

  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue ? issue.path.join('.') : 'unknown';
    throw new FrontmatterValidationError(field, issue?.message);
  }

  atomicWrite(filePath, matter.stringify(body, result.data as unknown as Record<string, unknown>));
}
