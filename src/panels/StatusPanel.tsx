import { Box, Text } from 'ink';
import type React from 'react';
import type { Config } from '../config/types.js';
import type { OllamaStatus } from '../data/ollama.js';
import { semantic } from '../theme/semantic.js';

interface StatusPanelProps {
  ollama: OllamaStatus | null;
  config: Config;
}

export function StatusPanel({ ollama, config }: StatusPanelProps): React.JSX.Element {
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={semantic.border}
      paddingX={1}
      flexGrow={1}
    >
      <Text bold color={semantic.body}>
        Status
      </Text>
      <Text> </Text>
      <Box flexDirection="row" gap={1}>
        <Text color={semantic.muted}>Ollama</Text>
        {ollama === null ? (
          <Text color={semantic.muted}>checking…</Text>
        ) : ollama.online ? (
          <Text color={semantic.success}>online</Text>
        ) : (
          <Text color={semantic.warning}>offline</Text>
        )}
      </Box>
      <Box flexDirection="row" gap={1}>
        <Text color={semantic.muted}>Claude</Text>
        <Text color={semantic.secondary}>{config.claude.binary}</Text>
      </Box>
    </Box>
  );
}
