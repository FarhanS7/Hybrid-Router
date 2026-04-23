import { createChildLogger } from "@har/logger";
import type { Intent } from "@har/shared";
import { isMessyPrompt } from "../planner/isMessyPrompt.js";
import { isMultiStepPrompt } from "../planner/isMultiStepPrompt.js";

const logger = createChildLogger("decision:hybrid");

/**
 * Determines whether a prompt qualifies for HYBRID execution.
 *
 * Conservative by design — if uncertain, returns false.
 *
 * Triggers:
 *   1. Sensitive + complex reasoning → local redaction before cloud
 *   2. Messy prompt + cloud-worthy task → local cleanup before cloud
 *   3. Multi-step request → local preprocess + cloud reason + local format
 */
export function shouldUseHybrid(prompt: string, intent: Intent): boolean {
  // Trigger 1: Sensitive data that still needs cloud-grade reasoning
  if (intent.sensitive && intent.complexity === "complex") {
    logger.info({ trigger: "sensitive_complex" }, "Hybrid eligible: sensitive + complex");
    return true;
  }

  // Trigger 2: Messy prompt that needs cloud reasoning
  const cloudWorthy = ["reasoning", "architecture", "debugging"].includes(intent.taskType);
  if (isMessyPrompt(prompt) && (cloudWorthy || intent.complexity !== "simple")) {
    logger.info({ trigger: "messy_prompt" }, "Hybrid eligible: messy + cloud-worthy");
    return true;
  }

  // Trigger 3: Multi-step request
  if (isMultiStepPrompt(prompt)) {
    logger.info({ trigger: "multi_step" }, "Hybrid eligible: multi-step request");
    return true;
  }

  return false;
}
