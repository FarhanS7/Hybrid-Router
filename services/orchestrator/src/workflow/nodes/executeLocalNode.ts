import { createChildLogger } from "@har/logger";
import { generateLocal } from "../../clients/localLlmClient.js";
import { HarWorkflowStateType } from "../state.js";

const logger = createChildLogger("workflow:execute-local");

/**
 * Node: executeLocal
 * Calls the local-llm service.
 */
export async function executeLocalNode(state: HarWorkflowStateType) {
  logger.info({ node: "executeLocal" }, "Entering executeLocalNode");
  
  const prompt = state.normalizedPrompt || state.prompt;
  
  try {
    const providerResult = await generateLocal(prompt);
    
    return {
      providerResult,
      logs: [`Local execution successful (model: ${providerResult.model})`],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Local execution failed";
    logger.error({ error: message }, "Local execution failed");
    throw error;
  }
}
