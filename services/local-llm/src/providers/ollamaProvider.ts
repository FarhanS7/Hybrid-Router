import { env } from "@har/config";
import { createChildLogger } from "@har/logger";
import type { ProviderResult } from "@har/shared";

const logger = createChildLogger("ollama-provider");

interface OllamaGenerateResponse {
  response: string;
  done: boolean;
  model: string;
}

/**
 * Call Ollama HTTP API to generate a completion.
 */
export async function generateWithOllama(prompt: string): Promise<ProviderResult> {
  const start = Date.now();
  const url = `${env.OLLAMA_BASE_URL}/api/generate`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.OLLAMA_MODEL,
        prompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(env.LOCAL_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, errorText }, "Ollama API error");
      return {
        provider: "LOCAL",
        model: env.OLLAMA_MODEL,
        output: "",
        latencyMs: Date.now() - start,
        success: false,
        errorType: "PROVIDER_ERROR",
        errorMessage: `Ollama returned ${response.status}: ${errorText}`,
      };
    }

    const data = (await response.json()) as OllamaGenerateResponse;
    const latencyMs = Date.now() - start;

    logger.info({ model: data.model, latencyMs }, "Ollama generation complete");

    return {
      provider: "LOCAL",
      model: data.model,
      output: data.response,
      latencyMs,
      success: true,
    };
  } catch (error) {
    const latencyMs = Date.now() - start;
    const message = error instanceof Error ? error.message : "Unknown error";

    logger.error({ error: message, latencyMs }, "Ollama generation failed");

    return {
      provider: "LOCAL",
      model: env.OLLAMA_MODEL,
      output: "",
      latencyMs,
      success: false,
      errorType: message.includes("timeout") ? "TIMEOUT" : "CONNECTION_ERROR",
      errorMessage: message,
    };
  }
}
