import { createChildLogger } from "@har/logger";
import type { HarResponse } from "@har/shared";
import { normalizePrompt } from "../utils/normalizePrompt.js";
import { routePrompt } from "../decision/routePrompt.js";
import { classifyIntent } from "../clients/intentClient.js";
import { generateLocal } from "../clients/localLlmClient.js";
import { generateCloud } from "../clients/cloudLlmClient.js";

const logger = createChildLogger("orchestrator");

/**
 * End-to-end prompt processing pipeline.
 *
 * Flow: normalize → classify intent → decide route → execute → assemble response → log
 */
export async function processPrompt(rawPrompt: string): Promise<HarResponse> {
  const totalStart = Date.now();

  // 1. Normalize
  const normalizedPrompt = normalizePrompt(rawPrompt);

  // 2. Classify intent
  const intent = await classifyIntent(normalizedPrompt);

  // 3. Decide route
  const route = routePrompt(intent);

  // 4. Execute on chosen provider
  const providerResult = route === "LOCAL"
    ? await generateLocal(normalizedPrompt)
    : await generateCloud(normalizedPrompt);

  // 5. Assemble response
  const totalLatency = Date.now() - totalStart;
  const response: HarResponse = {
    prompt: rawPrompt,
    normalizedPrompt,
    intent,
    route,
    result: providerResult.output,
    model: providerResult.model,
    latencyMs: totalLatency,
    success: providerResult.success,
    fallbackUsed: false,
  };

  // 6. Structured log
  logger.info({
    prompt: rawPrompt,
    normalizedPrompt,
    intent,
    route,
    provider: providerResult.provider,
    model: providerResult.model,
    providerLatencyMs: providerResult.latencyMs,
    totalLatencyMs: totalLatency,
    success: providerResult.success,
    fallbackUsed: false,
    ...(providerResult.errorType && { errorType: providerResult.errorType }),
    ...(providerResult.errorMessage && { errorMessage: providerResult.errorMessage }),
  }, "Request processed");

  return response;
}
