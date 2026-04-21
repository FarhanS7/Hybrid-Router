import { createChildLogger } from "@har/logger";
import { generateLocal } from "../../clients/localLlmClient.js";
import { generateCloud } from "../../clients/cloudLlmClient.js";
import { executeWithResilience } from "../../resilience/executeWithResilience.js";
import { HarWorkflowStateType } from "../state.js";

const logger = createChildLogger("workflow:execute-local");

/**
 * Node: executeLocal
 * Calls the local-llm service with resilience (retries, fallback to cloud).
 */
export async function executeLocalNode(state: HarWorkflowStateType) {
  logger.info({ node: "executeLocal" }, "Entering executeLocalNode");
  
  if (!state.intent) throw new Error("Missing intent in state");

  const prompt = state.normalizedPrompt || state.prompt;
  
  const { result, resilience } = await executeWithResilience(
    "LOCAL",
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
      `Local execution attempt finished. Success: ${result.success}`,
      resilience.retryCount > 0 ? `Retried ${resilience.retryCount} times` : "No retries needed",
      resilience.fallbackUsed ? "Fallback to CLOUD used" : "No fallback used"
    ],
  };
}
