import { createChildLogger } from "@har/logger";
import type { HarResponse } from "@har/shared";
import { HarWorkflowStateType } from "../state.js";

const logger = createChildLogger("workflow:finalize");

/**
 * Node: finalizeResponse
 * Assembles the final HarResponse from the workflow state.
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
      latencyMs: state.providerResult.latencyMs, // Simplified latency for Phase 3
      success: state.providerResult.success,
      fallbackUsed: false,
    };
    
    return {
      finalResponse,
      logs: ["Final response assembled"],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Finalization failed";
    logger.error({ error: message }, "Response finalization failed");
    throw error;
  }
}
