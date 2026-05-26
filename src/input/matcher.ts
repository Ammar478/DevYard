/** Trie node — each child is keyed by a single lowercase character. */
interface TrieNode {
  children: Map<string, TrieNode>;
  /** Original name stored at this terminal node (null if non-terminal). */
  name: string | null;
}

function makeNode(): TrieNode {
  return { children: new Map(), name: null };
}

/**
 * Case-insensitive trie built from project names at construction time.
 * Supports exact match (O(k)) and prefix suggestions (O(k + results)).
 */
export class ProjectMatcher {
  private readonly root: TrieNode = makeNode();

  constructor(names: readonly string[]) {
    for (const name of names) {
      this.insert(name);
    }
  }

  private insert(name: string): void {
    let node = this.root;
    for (const ch of name.toLowerCase()) {
      let child = node.children.get(ch);
      if (!child) {
        child = makeNode();
        node.children.set(ch, child);
      }
      node = child;
    }
    node.name = name;
  }

  /** Returns the original project name for an exact (case-insensitive) match, or null. */
  match(input: string): string | null {
    let node = this.root;
    for (const ch of input.toLowerCase()) {
      const child = node.children.get(ch);
      if (!child) return null;
      node = child;
    }
    return node.name;
  }

  /** Returns up to 5 original project names whose lowercased form starts with `prefix`. */
  suggest(prefix: string): string[] {
    let node = this.root;
    for (const ch of prefix.toLowerCase()) {
      const child = node.children.get(ch);
      if (!child) return [];
      node = child;
    }
    const results: string[] = [];
    this.collect(node, results);
    return results.slice(0, 5);
  }

  private collect(node: TrieNode, out: string[]): void {
    if (out.length >= 5) return;
    if (node.name !== null) out.push(node.name);
    for (const child of node.children.values()) {
      if (out.length >= 5) return;
      this.collect(child, out);
    }
  }
}
