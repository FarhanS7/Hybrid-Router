import { env } from "@har/config";
import { createChildLogger } from "@har/logger";
import type { ProviderResult } from "@har/shared";

const logger = createChildLogger("cloud-provider");

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message: string };
}

/**
 * Call Google Gemini API to generate a completion.
 */
async function generateWithGemini(prompt: string): Promise<ProviderResult> {
  const start = Date.now();
  const model = env.CLOUD_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.CLOUD_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
      signal: AbortSignal.timeout(env.CLOUD_TIMEOUT_MS),
    });

    const data = (await response.json()) as GeminiResponse;
    const latencyMs = Date.now() - start;

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || `HTTP ${response.status}`;
      logger.error({ status: response.status, error: errorMsg }, "Gemini API error");
      return {
        provider: "CLOUD",
        model,
        output: "",
        latencyMs,
        success: false,
        errorType: "PROVIDER_ERROR",
        errorMessage: errorMsg,
      };
    }

    const output = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    logger.info({ model, latencyMs }, "Gemini generation complete");

    return {
      provider: "CLOUD",
      model,
      output,
      latencyMs,
      success: true,
    };
  } catch (error) {
    const latencyMs = Date.now() - start;
    const message = error instanceof Error ? error.message : "Unknown error";

    logger.error({ error: message, latencyMs }, "Cloud generation failed");

    return {
      provider: "CLOUD",
      model,
      output: "",
      latencyMs,
      success: false,
      errorType: message.includes("timeout") ? "TIMEOUT" : "CONNECTION_ERROR",
      errorMessage: message,
    };
  }
}

/**
 * Route to the configured cloud provider.
 */
export async function generateWithCloud(prompt: string): Promise<ProviderResult> {
  // Currently only Gemini is supported; easy to extend later
  return generateWithGemini(prompt);
}
