import { createChildLogger } from "@har/logger";
import type { HarResponse } from "@har/shared";
import { HarWorkflowStateType } from "../state.js";

const logger = createChildLogger("workflow:finalize");

/**
 * Node: finalizeResponse
 * Assembles the final HarResponse from the workflow state,
 * including resilience metadata in case of fallback or failure.
 */
export async function finalizeResponseNode(state: HarWorkflowStateType) {
  logger.info({ node: "finalizeResponse" }, "Entering finalizeResponseNode");
  
  if (!state.providerResult || !state.intent || !state.route) {
    throw new Error("Missing required state for finalizing response");
  }
  
  try {
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
      // Error details if any (from resilience layer)
      errorType: state.errorType || state.providerResult.errorType,
      errorMessage: state.errorMessage || state.providerResult.errorMessage,
    };
    
    // Log resonance specific details
    if (state.fallbackUsed || !state.providerResult.success) {
      logger.info({
        fallbackUsed: state.fallbackUsed,
        retryCount: state.retryCount,
        success: state.providerResult.success,
        errorType: state.errorType
      }, "Finalizing with resilience events");
    }

    return {
      finalResponse,
      logs: ["Final response assembled with resilience metadata"],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Finalization failed";
    logger.error({ error: message }, "Response finalization failed");
    throw error;
  }
}
