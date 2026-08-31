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
    finalProvider: state.providerResult.provider,
    result: state.providerResult.output,
    routeReason: state.intent.reason || state.routingReason,
    model: state.providerResult.model,
    latencyMs: state.providerResult.latencyMs,
    success: state.providerResult.success,
    fallbackUsed: !!state.fallbackUsed,
    fallbackReason: state.fallbackUsed ? (state.errorType || state.errorMessage) : undefined,
    errorType: state.errorType || state.providerResult.errorType,
    errorMessage: state.errorMessage || state.providerResult.errorMessage,
    planType: planType as HarResponse["planType"],
    execution: {
      mode: planType === "HYBRID" ? "HYBRID" : "SINGLE",
      steps: state.hybridSteps && state.hybridSteps.length > 0 ? state.hybridSteps : undefined,
    },
  };

  // Log structured request completion metrics for Axiom / Logtail observability
  logger.info({
    route: state.route,
    finalProvider: state.providerResult.provider,
    latencyMs: state.providerResult.latencyMs,
    fallbackUsed: !!state.fallbackUsed,
    sensitive: !!state.intent?.sensitive,
    classifierMethod: state.intent?.classifierMethod,
    classifierConfidence: state.intent?.confidence,
    planType,
    success: state.providerResult.success,
  }, "Request complete");

  return {
    finalResponse,
    logs: [`Response finalized (plan: ${planType || "unknown"})`],
  };
}
