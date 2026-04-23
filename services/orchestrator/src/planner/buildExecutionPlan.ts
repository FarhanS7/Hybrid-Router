import { createChildLogger } from "@har/logger";
import type { ExecutionPlan, Route } from "@har/shared";

const logger = createChildLogger("planner");

/**
 * Builds the execution plan based on the decided route.
 * Phase 5 implements exactly one fixed hybrid pattern.
 */
export function buildExecutionPlan(route: Route): ExecutionPlan {
  if (route === "LOCAL") {
    return { type: "LOCAL_ONLY" };
  }

  if (route === "CLOUD") {
    return { type: "CLOUD_ONLY" };
  }

  // route === "HYBRID"
  logger.info("Building Phase 5 fixed HYBRID execution plan");
  return {
    type: "HYBRID",
    steps: [
      { step: "PREPROCESS", provider: "LOCAL" },
      { step: "REASON", provider: "CLOUD" },
      { step: "POSTPROCESS", provider: "LOCAL" },
    ],
  };
}
