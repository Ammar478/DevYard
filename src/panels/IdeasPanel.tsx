import { Box, Text } from 'ink';
import type React from 'react';
import type { IdeaSummary } from '../mcp/types.js';
import { semantic } from '../theme/semantic.js';

interface IdeasPanelProps {
  ideas: IdeaSummary[];
  mcpFailed: boolean;
  loading?: boolean;
}

export function IdeasPanel({
  ideas,
  mcpFailed,
  loading = false,
}: IdeasPanelProps): React.JSX.Element {
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={semantic.border}
      paddingX={1}
      flexGrow={1}
    >
      <Text bold color={semantic.body}>
        Ideas
      </Text>
      <Text> </Text>
      {mcpFailed ? (
        <Text color={semantic.warning}>! MCP unreachable</Text>
      ) : loading ? (
        <Text color={semantic.muted}>Loading…</Text>
      ) : ideas.length === 0 ? (
        <Text color={semantic.muted}>No recent ideas</Text>
      ) : (
        ideas.map((idea) => (
          <Box key={idea.path} flexDirection="row" gap={1}>
            <Text color={semantic.info}>•</Text>
            <Text color={semantic.body}>{idea.title}</Text>
          </Box>
        ))
      )}
    </Box>
  );
}
