import type { Logger } from './logger.js';

const _marks: Array<{ name: string; ms: number }> = [];

/** Record a named timestamp. Call at key lifecycle points. */
export function mark(name: string): void {
  _marks.push({ name, ms: +performance.now().toFixed(2) });
}

/** Write accumulated marks to logger.debug if level is 'debug'. */
export function flushMarks(logger: Logger, level: string): void {
  if (level !== 'debug' || _marks.length === 0) return;
  const timeline = Object.fromEntries(_marks.map((m) => [m.name, m.ms]));
  logger.debug('cold-start-timeline', timeline as Record<string, unknown>);
}
