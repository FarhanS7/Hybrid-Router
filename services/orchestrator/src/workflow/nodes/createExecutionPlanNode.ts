import { createChildLogger } from "@har/logger";
import { createExecutionPlan } from "../../planner/createExecutionPlan.js";
import { HarWorkflowStateType } from "../state.js";

const logger = createChildLogger("workflow:plan");

/**
 * Node: createExecutionPlan
 * Decides whether to use LOCAL_ONLY, CLOUD_ONLY, or HYBRID execution.
 */
export async function createExecutionPlanNode(state: HarWorkflowStateType) {
  logger.info({ node: "createExecutionPlan" }, "Entering createExecutionPlanNode");

  if (!state.intent || !state.route) {
    throw new Error("Missing intent or route for execution planning");
  }

  const prompt = state.normalizedPrompt || state.prompt;
  const plan = createExecutionPlan(prompt, state.intent, state.route);

  logger.info({
    stage: "plan_created",
    planType: plan.type,
    steps: plan.type === "HYBRID" ? plan.steps : undefined,
  }, "Execution plan created");

  return {
    executionPlan: plan,
    logs: [`Execution plan: ${plan.type}${plan.type === "HYBRID" ? ` (${plan.steps.length} steps)` : ""}`],
  };
}
