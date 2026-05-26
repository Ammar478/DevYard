import { spawn } from 'node:child_process';
import { Command } from 'commander';
import { render } from 'ink';
import React from 'react';
import { App } from './app.js';
import { readConfig } from './config/load.js';
import { runDoctor } from './doctor/check.js';
import { renderReport } from './doctor/render.js';
import type { Action } from './input/dispatcher.js';
import { runInit } from './installer/init.js';
import { launchSkill } from './skills/launcher.js';
import { createLogger } from './utils/logger.js';
import { flushMarks, mark } from './utils/perf.js';

const program = new Command();

program.name('devyard').description('Personal engineering OS').version('1.0.0');

program
  .command('doctor')
  .description('Run health checks')
  .option('--hooks-deep', 'Also run 7 synthetic hook checks')
  .action(async (opts: { hooksDeep?: boolean }) => {
    const config = readConfig();
    const report = await runDoctor({ config }, opts.hooksDeep ? { hooksDeep: true } : {});
    renderReport(report);
    process.exit(report.passed ? 0 : 1);
  });

program
  .command('init')
  .description('Set up DevYard on this machine')
  .action(async () => {
    const config = readConfig();
    await runInit(config);
  });

program.action(async () => {
  mark('process-start');
  const config = readConfig();
  mark('config-loaded');
  const logger = createLogger(config.logging.path, config.logging.level);
  const pendingActions: Action[] = [];

  const { waitUntilExit } = render(
    React.createElement(App, {
      config,
      logger,
      onLaunchAction: (action: Action) => pendingActions.push(action),
    }),
  );

  await waitUntilExit();
  flushMarks(logger, config.logging.level);

  const action = pendingActions[0];
  if (!action) process.exit(0);

  if (action.kind === 'launch-skill') {
    const code = await launchSkill(action.skill, null, config, { logger });
    process.exit(code);
  } else if (action.kind === 'freeform-query') {
    const child = spawn(config.claude.binary, [], {
      stdio: 'inherit',
      env: {
        ...(process.env as Record<string, string>),
        DEVYARD_FREEFORM_QUERY: action.text,
      },
      cwd: process.cwd(),
    });
    const code = await new Promise<number>((resolve) => {
      child.on('error', () => resolve(1));
      child.on('close', (c) => resolve(c ?? 1));
    });
    process.exit(code);
  }
});

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
