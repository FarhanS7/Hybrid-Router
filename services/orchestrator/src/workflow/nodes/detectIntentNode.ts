import { createChildLogger } from "@har/logger";
import { classifyIntent } from "../../clients/intentClient.js";
import { HarWorkflowStateType } from "../state.js";

const logger = createChildLogger("workflow:intent");

/**
 * Node: detectIntent
 * Calls the intent-service to classify the prompt.
 */
export async function detectIntentNode(state: HarWorkflowStateType) {
  logger.info({ node: "detectIntent" }, "Entering detectIntentNode");
  
  const prompt = state.normalizedPrompt || state.prompt;
  
  try {
    const intent = await classifyIntent(prompt);
    
    logger.info({ intent }, "Intent detected");
    
    return {
      intent,
      logs: [`Intent detected: ${intent.taskType} (confidence: ${intent.confidence})`],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Intent detection failed";
    logger.error({ error: message }, "Intent detection failed");
    throw error;
  }
}
