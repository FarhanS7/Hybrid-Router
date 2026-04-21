import { createChildLogger } from "@har/logger";
import { generateLocal } from "../../clients/localLlmClient.js";
import { generateCloud } from "../../clients/cloudLlmClient.js";
import { executeWithResilience } from "../../resilience/executeWithResilience.js";
import { HarWorkflowStateType } from "../state.js";

const logger = createChildLogger("workflow:execute-cloud");

/**
 * Node: executeCloud
 * Calls the cloud-llm service with resilience (retries, fallback to local).
 */
export async function executeCloudNode(state: HarWorkflowStateType) {
  logger.info({ node: "executeCloud" }, "Entering executeCloudNode");
  
  if (!state.intent) throw new Error("Missing intent in state");

  const prompt = state.normalizedPrompt || state.prompt;
  
  const { result, resilience } = await executeWithResilience(
    "CLOUD",
    state.intent,
    prompt,
    {
      LOCAL: generateLocal,
      CLOUD: generateCloud,
    }
  );

  return {
    providerResult: result,
    fallbackUsed: resilience.fallbackUsed,
    retryCount: resilience.retryCount,
    errorType: resilience.errorType,
    errorMessage: resilience.errorMessage,
    logs: [
      `Cloud execution attempt finished. Success: ${result.success}`,
      resilience.retryCount > 0 ? `Retried ${resilience.retryCount} times` : "No retries needed",
      resilience.fallbackUsed ? "Fallback to LOCAL used" : "No fallback used"
    ],
  };
}
