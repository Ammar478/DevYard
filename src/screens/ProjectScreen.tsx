import { Box, Text, useInput } from 'ink';
import type React from 'react';
import { useEffect, useRef } from 'react';
import type { ScannedProject } from '../data/vault-scanner.js';
import { icons } from '../theme/icons.js';
import { semantic } from '../theme/semantic.js';

interface ProjectScreenProps {
  project: ScannedProject;
  onEscape: () => void;
  /** Timestamp (performance.now()) when navigation was initiated; used to measure render latency. */
  navStartMs?: number | undefined;
  onNavLatency?: ((ms: number) => void) | undefined;
}

function statusColor(status: string): string {
  if (status === 'active') return semantic.success;
  if (status === 'parked') return semantic.parked;
  return semantic.muted;
}

export function ProjectScreen({
  project,
  onEscape,
  navStartMs,
  onNavLatency,
}: ProjectScreenProps): React.JSX.Element {
  const fm = project.frontmatter;
  // Capture props at mount time so the effect can close over stable refs.
  const navStartMsRef = useRef(navStartMs);
  const onNavLatencyRef = useRef(onNavLatency);

  useEffect(() => {
    const t = navStartMsRef.current;
    if (t !== undefined) {
      const latencyMs = +(performance.now() - t).toFixed(2);
      onNavLatencyRef.current?.(latencyMs);
    }
  }, []);

  useInput((_, key) => {
    if (key.escape) onEscape();
  });

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={semantic.border} paddingX={1}>
      <Box flexDirection="row" gap={1}>
        <Text bold color={semantic.project}>
          {fm.name}
        </Text>
        <Text color={semantic.muted}>{fm.tier}</Text>
        <Text color={statusColor(fm.status)}>{fm.status}</Text>
      </Box>
      <Text> </Text>

      {fm.repos.length > 0 ? (
        <>
          <Text color={semantic.muted}>Repos</Text>
          {fm.repos.map((repo) => (
            <Box key={repo} flexDirection="row" gap={1}>
              <Text color={semantic.muted}> {icons.selected}</Text>
              <Text color={semantic.code}>{repo}</Text>
            </Box>
          ))}
          <Text> </Text>
        </>
      ) : null}

      {fm.last_branch !== null ? (
        <Box flexDirection="row" gap={1}>
          <Text color={semantic.muted}>Branch</Text>
          <Text color={semantic.highlight}>{fm.last_branch}</Text>
        </Box>
      ) : null}

      {fm.last_ticket !== null ? (
        <Box flexDirection="row" gap={1}>
          <Text color={semantic.muted}>Ticket</Text>
          <Text color={semantic.secondary}>{fm.last_ticket}</Text>
        </Box>
      ) : null}

      {fm.last_session !== null ? (
        <Box flexDirection="row" gap={1}>
          <Text color={semantic.muted}>Session</Text>
          <Text color={semantic.secondary}>{fm.last_session}</Text>
        </Box>
      ) : null}

      {fm.stack.length > 0 ? (
        <Box flexDirection="row" gap={1}>
          <Text color={semantic.muted}>Stack</Text>
          <Text color={semantic.body}>{fm.stack.join(', ')}</Text>
        </Box>
      ) : null}

      <Text> </Text>
      <Text color={semantic.muted}>Escape → return to landing</Text>
    </Box>
  );
}
