import type { Check } from '../check.js';
import { depsChecks } from './deps.js';
import { engineChecks } from './engine.js';
import { envChecks } from './env.js';
import { hooksChecks } from './hooks.js';
import { integrationChecks } from './integration.js';
import { vaultChecks } from './vault.js';

export const allChecks: Check[] = [
  ...envChecks,
  ...vaultChecks,
  ...integrationChecks,
  ...hooksChecks,
  ...engineChecks,
  ...depsChecks,
];
