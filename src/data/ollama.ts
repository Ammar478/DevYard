import type { Config } from '../config/types.js';

export interface OllamaStatus {
  online: boolean;
}

export async function checkOllama(config: Config): Promise<OllamaStatus> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.ollama.timeout_ms);
  try {
    const res = await fetch(`${config.ollama.url}/api/tags`, {
      signal: controller.signal,
    });
    return { online: res.ok };
  } catch {
    return { online: false };
  } finally {
    clearTimeout(timeoutId);
  }
}
