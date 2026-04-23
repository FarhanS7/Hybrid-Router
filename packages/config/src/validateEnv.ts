import { env } from "./env.js";

/**
 * Checks if a URL is reachable via a simple fetch.
 */
async function isReachable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(2000) });
    return response.ok || response.status === 404; // 404 is still "reachable" for Ollama / endpoint
  } catch {
    return false;
  }
}

export interface ValidationResult {
  service: string;
  status: "ok" | "warn" | "error";
  message: string;
  tip?: string;
}

/**
 * Validates the core service endpoints and configuration.
 */
export async function validateEnv(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  // 1. Check Ollama
  const ollamaOk = await isReachable(env.OLLAMA_BASE_URL);
  if (ollamaOk) {
    results.push({
      service: "Ollama",
      status: "ok",
      message: `Connected to ${env.OLLAMA_BASE_URL}`,
    });
  } else {
    results.push({
      service: "Ollama",
      status: "error",
      message: `Could not reach Ollama at ${env.OLLAMA_BASE_URL}`,
      tip: "Run `ollama serve` to start the local LLM engine.",
    });
  }

  // 2. Check Cloud Config
  if (env.CLOUD_API_KEY) {
    results.push({
      service: "Cloud Provider",
      status: "ok",
      message: `Configured for ${env.CLOUD_PROVIDER} (${env.CLOUD_MODEL})`,
    });
  } else {
    results.push({
      service: "Cloud Provider",
      status: "warn",
      message: "CLOUD_API_KEY is missing. Cloud routing and Hybrid features will be disabled.",
      tip: "Add CLOUD_API_KEY to your .env file to enable full hybrid capabilities.",
    });
  }

  return results;
}
