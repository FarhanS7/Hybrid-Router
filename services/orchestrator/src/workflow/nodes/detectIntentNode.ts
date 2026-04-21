import { createChildLogger } from "@har/logger";
import { classifyIntent } from "../../clients/intentClient.js";
import { getFallbackIntent } from "../../decision/fallbackIntent.js";
import { HarWorkflowStateType } from "../state.js";

const logger = createChildLogger("workflow:intent");

/**
 * Node: detectIntent
 * Calls the intent-service to classify the prompt.
 * Includes fallback logic if the service is down.
 */
export async function detectIntentNode(state: HarWorkflowStateType) {
  logger.info({ node: "detectIntent" }, "Entering detectIntentNode");
  
  const prompt = state.normalizedPrompt || state.prompt;
  
  try {
    // We could add a timeout here too if intentClient doesn't have one
    const intent = await classifyIntent(prompt);
    
    logger.info({ intent }, "Intent detected");
    
    return {
      intent,
      logs: [`Intent detected: ${intent.taskType}`],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Intent service unavailable";
    logger.warn({ error: message }, "Intent service failed, using conservative fallback");
    
    const fallbackIntent = getFallbackIntent(prompt);
    
    return {
      intent: fallbackIntent,
      errorType: "CLASSIFIER_FAILURE",
      errorMessage: message,
      logs: ["Intent service failed, used conservative heuristic fallback"],
    };
  }
}
