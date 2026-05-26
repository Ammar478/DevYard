import { Box, Text } from 'ink';
import type React from 'react';
import type { Config } from '../config/types.js';
import type { ScanWarning, ScannedProject } from '../data/vault-scanner.js';
import { icons } from '../theme/icons.js';
import { semantic } from '../theme/semantic.js';

interface ProjectsPanelProps {
  projects: ScannedProject[];
  warnings: ScanWarning[];
  config: Config;
  loading?: boolean;
}

function statusIcon(status: string): string {
  if (status === 'active') return icons.active;
  if (status === 'parked') return icons.parked;
  return icons.archived;
}

function statusColor(status: string): string {
  if (status === 'active') return semantic.success;
  if (status === 'parked') return semantic.parked;
  return semantic.muted;
}

export function ProjectsPanel({
  projects,
  warnings,
  config,
  loading = false,
}: ProjectsPanelProps): React.JSX.Element {
  const visible = projects.filter((p) => {
    if (p.frontmatter.status === 'parked' && !config.ui.show_parked_projects) return false;
    if (p.frontmatter.status === 'archived' && !config.ui.show_archived_projects) return false;
    return true;
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={semantic.border}
      paddingX={1}
      flexGrow={1}
    >
      <Text bold color={semantic.body}>
        Projects
      </Text>
      <Text> </Text>
      {loading ? (
        <Text color={semantic.muted}>Loading…</Text>
      ) : visible.length === 0 && warnings.length === 0 ? (
        <Text color={semantic.muted}>No projects found</Text>
      ) : (
        <>
          {visible.map((p) => (
            <Box key={p.dir} flexDirection="row" gap={1}>
              <Text color={statusColor(p.frontmatter.status)}>
                {statusIcon(p.frontmatter.status)}
              </Text>
              <Text color={semantic.project}>{p.frontmatter.name}</Text>
              <Text color={semantic.muted}>{p.frontmatter.tier}</Text>
              {p.frontmatter.last_ticket !== null ? (
                <Text color={semantic.secondary}>{p.frontmatter.last_ticket}</Text>
              ) : null}
            </Box>
          ))}
          {warnings.map((w) => (
            <Box key={w.projectDir} flexDirection="row" gap={1}>
              <Text color={semantic.warning}>⚠</Text>
              <Text color={semantic.secondary}>{w.projectDir}</Text>
              <Text color={semantic.muted}>({w.reason})</Text>
            </Box>
          ))}
        </>
      )}
    </Box>
  );
}
