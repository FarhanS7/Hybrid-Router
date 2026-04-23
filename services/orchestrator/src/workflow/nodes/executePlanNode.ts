import { createChildLogger } from "@har/logger";
import { executePlan } from "../../services/executePlan.js";
import { HarWorkflowStateType } from "../state.js";

const logger = createChildLogger("workflow:execute-plan");

/**
 * Node: executePlan
 * Interprets the execution plan and runs LOCAL_ONLY, CLOUD_ONLY, or HYBRID pipeline.
 */
export async function executePlanNode(state: HarWorkflowStateType) {
  logger.info({ node: "executePlan" }, "Entering executePlanNode");

  if (!state.executionPlan || !state.intent) {
    throw new Error("Missing execution plan or intent in state");
  }

  const prompt = state.normalizedPrompt || state.prompt;
  const { finalResult, stepResults, fallbackUsed, totalLatencyMs } = await executePlan(
    state.executionPlan,
    prompt,
    state.intent
  );

  const planType = state.executionPlan.type;

  logger.info({
    stage: "plan_complete",
    planType,
    stepsExecuted: stepResults.length,
    totalLatencyMs,
    fallbackUsed,
    success: finalResult.success,
  }, "Execution plan completed");

  return {
    providerResult: finalResult,
    stepResults,
    fallbackUsed,
    logs: [
      `Plan ${planType} executed: ${stepResults.length} step(s), ${totalLatencyMs}ms total`,
      fallbackUsed ? "Fallback was used during execution" : "No fallback needed",
    ],
  };
}
