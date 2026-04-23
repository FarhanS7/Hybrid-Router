import { createChildLogger } from "@har/logger";
import type { HarResponse } from "@har/shared";
import { HarWorkflowStateType } from "../state.js";

const logger = createChildLogger("workflow:finalize");

/**
 * Node: finalizeResponse
 * Assembles the final HarResponse from the workflow state,
 * including resilience and hybrid execution metadata.
 */
export async function finalizeResponseNode(state: HarWorkflowStateType) {
  logger.info({ node: "finalizeResponse" }, "Entering finalizeResponseNode");

  if (!state.providerResult || !state.intent || !state.route) {
    throw new Error("Missing required state for finalizing response");
  }

  const planType = state.executionPlan?.type;

  const finalResponse: HarResponse = {
    prompt: state.prompt,
    normalizedPrompt: state.normalizedPrompt || state.prompt,
    intent: state.intent,
    route: state.route,
    result: state.providerResult.output,
    model: state.providerResult.model,
    latencyMs: state.providerResult.latencyMs,
    success: state.providerResult.success,
    fallbackUsed: !!state.fallbackUsed,
    errorType: state.errorType || state.providerResult.errorType,
    errorMessage: state.errorMessage || state.providerResult.errorMessage,
    planType: planType as HarResponse["planType"],
    execution: {
      mode: planType === "HYBRID" ? "HYBRID" : "SINGLE",
      steps: state.hybridSteps && state.hybridSteps.length > 0 ? state.hybridSteps : undefined,
    },
  };

  // Log resilience and hybrid details
  if (state.fallbackUsed || !state.providerResult.success || planType === "HYBRID") {
    logger.info({
      planType,
      fallbackUsed: state.fallbackUsed,
      retryCount: state.retryCount,
      success: state.providerResult.success,
      stepsExecuted: state.stepResults?.length,
      errorType: state.errorType,
    }, "Finalizing with execution metadata");
  }

  return {
    finalResponse,
    logs: [`Response finalized (plan: ${planType || "unknown"})`],
  };
}
