import { createChildLogger } from "@har/logger";
import type { ExecutionPlan, Intent, Route } from "@har/shared";
import { isMessyPrompt } from "./isMessyPrompt.js";
import { isMultiStepPrompt } from "./isMultiStepPrompt.js";

const logger = createChildLogger("planner");

/**
 * Creates an execution plan based on intent, route, and prompt characteristics.
 *
 * Hybrid is NOT the default. It is only chosen when it materially improves results.
 *
 * Rules (in priority order):
 *   1. Sensitive + complex → HYBRID (local sanitize → cloud reason)
 *   2. Messy prompt → HYBRID (local preprocess → cloud reason)
 *   3. Multi-step request → HYBRID (local preprocess → cloud reason → local postprocess)
 *   4. Otherwise → single-step (LOCAL_ONLY or CLOUD_ONLY)
 */
export function createExecutionPlan(
  prompt: string,
  intent: Intent,
  route: Route
): ExecutionPlan {
  // Rule 1: Sensitive + complex → hybrid with local sanitization first
  if (intent.sensitive && intent.complexity === "complex") {
    logger.info({ rule: "sensitive+complex" }, "Hybrid plan: local sanitize → cloud reason");
    return {
      type: "HYBRID",
      steps: [
        { step: "PREPROCESS", provider: "LOCAL" },
        { step: "REASON", provider: "CLOUD" },
      ],
    };
  }

  // Rule 2: Messy prompt that needs cloud reasoning → hybrid with local cleanup
  if (isMessyPrompt(prompt) && (route === "CLOUD" || intent.complexity !== "simple")) {
    logger.info({ rule: "messy_prompt" }, "Hybrid plan: local preprocess → cloud reason");
    return {
      type: "HYBRID",
      steps: [
        { step: "PREPROCESS", provider: "LOCAL" },
        { step: "REASON", provider: "CLOUD" },
      ],
    };
  }

  // Rule 3: Multi-step request → hybrid with full pipeline
  if (isMultiStepPrompt(prompt)) {
    logger.info({ rule: "multi_step" }, "Hybrid plan: local preprocess → cloud reason → local postprocess");
    return {
      type: "HYBRID",
      steps: [
        { step: "PREPROCESS", provider: "LOCAL" },
        { step: "REASON", provider: "CLOUD" },
        { step: "POSTPROCESS", provider: "LOCAL" },
      ],
    };
  }

  // Default: single-step execution
  if (route === "LOCAL") {
    return { type: "LOCAL_ONLY" };
  }

  return { type: "CLOUD_ONLY" };
}
