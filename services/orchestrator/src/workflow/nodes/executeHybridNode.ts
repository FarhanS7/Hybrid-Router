import { createChildLogger } from "@har/logger";
import { executePlan } from "../../services/executePlan.js";
import { buildExecutionPlan } from "../../planner/buildExecutionPlan.js";
import { HarWorkflowStateType } from "../state.js";

const logger = createChildLogger("workflow:execute-hybrid");

/**
 * Node: executeHybrid
 * Handles the multi-step HYBRID execution pipeline.
 */
export async function executeHybridNode(state: HarWorkflowStateType) {
  logger.info({ node: "executeHybrid" }, "Entering executeHybridNode");

  if (!state.intent || state.route !== "HYBRID") {
    throw new Error("Invalid state or route for executeHybridNode");
  }

  const prompt = state.normalizedPrompt || state.prompt;
  const executionPlan = buildExecutionPlan("HYBRID");

  const { finalResult, stepResults, hybridSteps, fallbackUsed, totalLatencyMs } = await executePlan(
    executionPlan,
    prompt,
    state.intent
  );

  logger.info({
    stage: "hybrid_complete",
    stepsExecuted: stepResults.length,
    totalLatencyMs,
    fallbackUsed,
    success: finalResult.success,
  }, "Hybrid execution completed");

  return {
    executionPlan,
    providerResult: finalResult,
    stepResults,
    hybridSteps,
    fallbackUsed,
    errorType: finalResult.errorType,
    errorMessage: finalResult.errorMessage,
    logs: [
      `Hybrid plan executed: ${stepResults.length} step(s), ${totalLatencyMs}ms total`,
      fallbackUsed ? "Fallback was used during hybrid execution" : "No fallback needed",
    ],
  };
}
