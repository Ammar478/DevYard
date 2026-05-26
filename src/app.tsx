import { Box, useApp } from 'ink';
import type React from 'react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Config } from './config/types.js';
import { loadHistory, saveHistory } from './data/history.js';
import type { OllamaStatus } from './data/ollama.js';
import { checkOllama } from './data/ollama.js';
import { type ScanResult, scanVault } from './data/vault-scanner.js';
import type { ScannedProject } from './data/vault-scanner.js';
import type { Action } from './input/dispatcher.js';
import { ProjectMatcher } from './input/matcher.js';
import { ObsidianMcpClient } from './mcp/client.js';
import { listRecentIdeas } from './mcp/obsidian-client.js';
import type { IdeaSummary } from './mcp/types.js';
import { LandingScreen } from './screens/LandingScreen.js';
import { ProjectScreen } from './screens/ProjectScreen.js';
import { resolveSkill } from './skills/resolver.js';
import type { Logger } from './utils/logger.js';
import { mark } from './utils/perf.js';

export interface AppContext {
  config: Config;
  scanResult: ScanResult;
  mcpStatus: 'connected' | 'disconnected' | 'connecting';
  ollamaStatus: OllamaStatus | null;
  history: string[];
  skills: { resolve: typeof resolveSkill };
}

const AppCtx = createContext<AppContext | null>(null);

export function useAppContext(): AppContext {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useAppContext must be used inside <App>');
  return ctx;
}

interface AppProps {
  config: Config;
  logger?: Logger;
  onLaunchAction: (action: Action) => void;
}

const EMPTY_SCAN: ScanResult = {
  projects: [],
  matcher: new ProjectMatcher([]),
  warnings: [],
};

export function App({ config, logger, onLaunchAction }: AppProps): React.JSX.Element {
  const { exit } = useApp();

  const [scanResult, setScanResult] = useState<ScanResult>(EMPTY_SCAN);
  const [scanLoading, setScanLoading] = useState(true);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [ideas, setIdeas] = useState<IdeaSummary[]>([]);
  const [mcpStatus, setMcpStatus] = useState<'connected' | 'disconnected' | 'connecting'>(
    'connecting',
  );
  const [ideasLoading, setIdeasLoading] = useState(true);
  const [history, setHistory] = useState<string[]>([]);
  const [currentProject, setCurrentProject] = useState<ScannedProject | null>(null);
  const [navStartMs, setNavStartMs] = useState<number | undefined>(undefined);

  const mcpClientRef = useRef(new ObsidianMcpClient());
  const historyRef = useRef<string[]>([]);
  const loggerRef = useRef(logger);
  loggerRef.current = logger;
  const scanResultRef = useRef(scanResult);
  scanResultRef.current = scanResult;
  // Stable refs so the startup effect closes over the latest values without re-running
  const configRef = useRef(config);
  const exitRef = useRef(exit);
  exitRef.current = exit;
  const onLaunchActionRef = useRef(onLaunchAction);
  onLaunchActionRef.current = onLaunchAction;

  useEffect(() => {
    mark('skeleton-render');
    const cfg = configRef.current;
    const client = mcpClientRef.current;
    historyRef.current = loadHistory();
    setHistory(historyRef.current);

    let panelsFilled = 0;
    const maybeMarkPanelsFilled = () => {
      panelsFilled += 1;
      if (panelsFilled === 3) mark('panels-filled');
    };

    void Promise.allSettled([
      scanVault(cfg, loggerRef.current)
        .then((result) => {
          setScanResult(result);
          setScanLoading(false);
          mark('vault-scan-complete');
          maybeMarkPanelsFilled();
        })
        .catch(() => {
          setScanLoading(false);
          maybeMarkPanelsFilled();
        }),

      client
        .connect(cfg.mcp.obsidian)
        .then(async () => {
          setMcpStatus('connected');
          const fetched = await listRecentIdeas(client);
          setIdeas(fetched);
          setIdeasLoading(false);
          maybeMarkPanelsFilled();
        })
        .catch(() => {
          setMcpStatus('disconnected');
          setIdeasLoading(false);
          maybeMarkPanelsFilled();
        }),

      checkOllama(cfg)
        .then((status) => {
          setOllamaStatus(status);
          maybeMarkPanelsFilled();
        })
        .catch(() => {
          setOllamaStatus({ online: false });
          maybeMarkPanelsFilled();
        }),
    ]);

    const onSigint = () => {
      saveHistory(historyRef.current);
      exitRef.current();
    };
    process.once('SIGINT', onSigint);

    return () => {
      process.off('SIGINT', onSigint);
      void client.disconnect();
    };
  }, []);

  const handleAction = (action: Action) => {
    if (action.kind === 'noop' || action.kind === 'error') return;

    if (action.kind === 'navigate') {
      const project = scanResultRef.current.projects.find(
        (p) => p.frontmatter.name === action.project,
      );
      if (project) {
        setNavStartMs(performance.now());
        setCurrentProject(project);
      }
      return;
    }

    // launch-skill and freeform-query: hand off to cli.ts, then exit Ink
    saveHistory(historyRef.current);
    onLaunchActionRef.current(action);
    exitRef.current();
  };

  const handleNavLatency = (ms: number) => {
    loggerRef.current?.debug('project-nav-latency', { latencyMs: ms });
  };

  const handleKeystrokeLatency = (ms: number) => {
    loggerRef.current?.debug('keystroke-latency', { latencyMs: ms });
  };

  const handleHistoryUpdate = (entries: string[]) => {
    historyRef.current = entries;
    setHistory(entries);
    saveHistory(entries);
  };

  const ctx: AppContext = {
    config,
    scanResult,
    mcpStatus,
    ollamaStatus,
    history,
    skills: { resolve: resolveSkill },
  };

  const dispatchCtx = {
    matcher: scanResult.matcher,
    skills: ctx.skills,
  };

  return (
    <AppCtx.Provider value={ctx}>
      <Box flexDirection="column">
        {currentProject ? (
          <ProjectScreen
            project={currentProject}
            onEscape={() => setCurrentProject(null)}
            navStartMs={navStartMs}
            onNavLatency={handleNavLatency}
          />
        ) : (
          <LandingScreen
            config={config}
            scanResult={scanResult}
            ollama={ollamaStatus}
            ideas={ideas}
            mcpFailed={mcpStatus === 'disconnected'}
            scanLoading={scanLoading}
            ideasLoading={ideasLoading}
            history={history}
            dispatchCtx={dispatchCtx}
            onAction={handleAction}
            onHistoryUpdate={handleHistoryUpdate}
            onKeystrokeLatency={handleKeystrokeLatency}
          />
        )}
      </Box>
    </AppCtx.Provider>
  );
}
