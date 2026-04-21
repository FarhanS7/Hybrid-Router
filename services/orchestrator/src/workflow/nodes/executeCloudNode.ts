import { createChildLogger } from "@har/logger";
import { generateCloud } from "../../clients/cloudLlmClient.js";
import { HarWorkflowStateType } from "../state.js";

const logger = createChildLogger("workflow:execute-cloud");

/**
 * Node: executeCloud
 * Calls the cloud-llm service.
 */
export async function executeCloudNode(state: HarWorkflowStateType) {
  logger.info({ node: "executeCloud" }, "Entering executeCloudNode");
  
  const prompt = state.normalizedPrompt || state.prompt;
  
  try {
    const providerResult = await generateCloud(prompt);
    
    return {
      providerResult,
      logs: [`Cloud execution successful (model: ${providerResult.model})`],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cloud execution failed";
    logger.error({ error: message }, "Cloud execution failed");
    throw error;
  }
}
