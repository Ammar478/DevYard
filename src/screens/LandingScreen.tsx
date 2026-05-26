import { Box } from 'ink';
import type React from 'react';
import type { Config } from '../config/types.js';
import type { OllamaStatus } from '../data/ollama.js';
import type { ScanResult } from '../data/vault-scanner.js';
import type { Action, DispatchContext } from '../input/dispatcher.js';
import type { IdeaSummary } from '../mcp/types.js';
import { IdeasPanel } from '../panels/IdeasPanel.js';
import { InputBox } from '../panels/InputBox.js';
import { ProjectsPanel } from '../panels/ProjectsPanel.js';
import { StatusPanel } from '../panels/StatusPanel.js';

interface LandingScreenProps {
  config: Config;
  scanResult: ScanResult;
  ollama: OllamaStatus | null;
  ideas: IdeaSummary[];
  mcpFailed: boolean;
  scanLoading: boolean;
  ideasLoading: boolean;
  history: string[];
  dispatchCtx: DispatchContext;
  onAction: (action: Action) => void;
  onHistoryUpdate: (entries: string[]) => void;
  onKeystrokeLatency?: ((ms: number) => void) | undefined;
}

export function LandingScreen({
  config,
  scanResult,
  ollama,
  ideas,
  mcpFailed,
  scanLoading,
  ideasLoading,
  history,
  dispatchCtx,
  onAction,
  onHistoryUpdate,
  onKeystrokeLatency,
}: LandingScreenProps): React.JSX.Element {
  const leftPct = config.ui.panel_widths[0];
  const rightPct = config.ui.panel_widths[1];

  return (
    <Box flexDirection="column">
      <Box flexDirection="row">
        <Box width={`${leftPct}%`}>
          <ProjectsPanel
            projects={scanResult.projects}
            warnings={scanResult.warnings}
            config={config}
            loading={scanLoading}
          />
        </Box>
        <Box flexDirection="column" width={`${rightPct}%`}>
          <StatusPanel ollama={ollama} config={config} />
          <IdeasPanel ideas={ideas} mcpFailed={mcpFailed} loading={ideasLoading} />
        </Box>
      </Box>
      <InputBox
        ctx={dispatchCtx}
        history={history}
        onAction={onAction}
        onHistoryUpdate={onHistoryUpdate}
        onKeystrokeLatency={onKeystrokeLatency}
      />
    </Box>
  );
}
