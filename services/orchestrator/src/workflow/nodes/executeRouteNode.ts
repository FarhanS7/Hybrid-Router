import { createChildLogger } from "@har/logger";
import { executeWithResilience } from "../../resilience/executeWithResilience.js";
import { generateLocal } from "../../clients/localLlmClient.js";
import { generateCloud } from "../../clients/cloudLlmClient.js";
import { HarWorkflowStateType } from "../state.js";

const logger = createChildLogger("workflow:execute-route");

const adapters = {
  LOCAL: generateLocal,
  CLOUD: generateCloud,
};

/**
 * Node: executeRoute
 * Handles single-step execution for LOCAL or CLOUD routes.
 */
export async function executeRouteNode(state: HarWorkflowStateType) {
  logger.info({ node: "executeRoute" }, "Entering executeRouteNode");

  if (!state.intent || !state.route) {
    throw new Error("Missing intent or route for execution");
  }

  if (state.route === "HYBRID") {
    throw new Error("executeRouteNode cannot handle HYBRID route");
  }

  const prompt = state.normalizedPrompt || state.prompt;
  
  // Create a minimal execution plan for state tracking
  const executionPlan = { type: `${state.route}_ONLY` as const };

  const { result, resilience } = await executeWithResilience(
    state.route,
    state.intent,
    prompt,
    adapters
  );

  return {
    executionPlan,
    providerResult: result,
    stepResults: [result],
    fallbackUsed: resilience.fallbackUsed,
    errorType: resilience.errorType,
    errorMessage: resilience.errorMessage,
    retryCount: resilience.retryCount,
    logs: [
      `Executed ${state.route} route in ${result.latencyMs}ms`,
      resilience.fallbackUsed ? "Fallback was used" : "No fallback needed",
    ],
  };
}
