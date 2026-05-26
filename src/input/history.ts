export interface HistoryNavResult {
  entry: string;
  newIdx: number;
}

/**
 * Navigates command history like a shell.
 * entries: oldest → newest, idx -1 = current (no selection).
 * 'up' goes to an older entry; 'down' goes to a newer one (or exits at -1).
 */
export function navigateHistory(
  entries: readonly string[],
  currentIdx: number,
  direction: 'up' | 'down',
): HistoryNavResult {
  if (entries.length === 0) return { entry: '', newIdx: -1 };

  if (direction === 'up') {
    if (currentIdx === -1) {
      const newIdx = entries.length - 1;
      return { entry: entries[newIdx] ?? '', newIdx };
    }
    const newIdx = Math.max(0, currentIdx - 1);
    return { entry: entries[newIdx] ?? '', newIdx };
  }

  // direction === 'down'
  if (currentIdx === -1 || currentIdx >= entries.length - 1) {
    return { entry: '', newIdx: -1 };
  }
  const newIdx = currentIdx + 1;
  return { entry: entries[newIdx] ?? '', newIdx };
}
