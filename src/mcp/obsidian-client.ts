import type { ObsidianMcpClient } from './client.js';
import type { IdeaSummary } from './types.js';

interface RecentChange {
  path: string;
  title?: string;
  modified?: string;
  tags?: string[];
}

/**
 * Lists up to `limit` recently changed files in the Ideas directory,
 * filtered to only items tagged #idea.
 */
export async function listRecentIdeas(
  client: ObsidianMcpClient,
  limit = 5,
): Promise<IdeaSummary[]> {
  const raw = await client.callTool('obsidian_get_recent_changes', {
    directory: 'Ideas',
    limit: limit * 3, // over-fetch to account for filtering
  });

  const items = extractArray(raw);
  return items
    .filter((item) => {
      const tags: string[] = Array.isArray(item.tags) ? (item.tags as string[]) : [];
      return tags.some((t) => t === '#idea' || t === 'idea');
    })
    .slice(0, limit)
    .map((item) => ({
      path: String(item.path ?? ''),
      title: String(item.title ?? item.path ?? ''),
      modified: String(item.modified ?? new Date().toISOString()),
      tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
    }));
}

/**
 * Writes `content` to the given vault-relative `path`.
 */
export async function putContent(
  client: ObsidianMcpClient,
  path: string,
  content: string,
): Promise<void> {
  await client.callTool('obsidian_put_content', { path, content });
}

function extractArray(raw: unknown): RecentChange[] {
  if (Array.isArray(raw)) return raw as RecentChange[];
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.content)) return r.content as RecentChange[];
    if (Array.isArray(r.items)) return r.items as RecentChange[];
    if (Array.isArray(r.results)) return r.results as RecentChange[];
  }
  return [];
}
