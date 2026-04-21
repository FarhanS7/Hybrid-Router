import { createChildLogger } from "@har/logger";
import { normalizePrompt as normalizeUtil } from "../../utils/normalizePrompt.js";
import { HarWorkflowStateType } from "../state.js";

const logger = createChildLogger("workflow:normalize");

/**
 * Node: normalizePrompt
 * Validates and normalizes the incoming prompt.
 */
export async function normalizePromptNode(state: HarWorkflowStateType) {
  logger.info({ node: "normalizePrompt" }, "Entering normalizePromptNode");
  
  try {
    const normalized = normalizeUtil(state.prompt);
    
    return {
      normalizedPrompt: normalized,
      logs: ["Prompt normalized successfully"],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Normalization failed";
    logger.error({ error: message }, "Prompt normalization failed");
    throw error; // Let graph handle terminal errors
  }
}
