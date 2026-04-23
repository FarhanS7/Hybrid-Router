import { StateGraph, START, END } from "@langchain/langgraph";
import { HarWorkflowState } from "./state.js";
import { normalizePromptNode } from "./nodes/normalizePromptNode.js";
import { detectIntentNode } from "./nodes/detectIntentNode.js";
import { decideRouteNode } from "./nodes/decideRouteNode.js";
import { createExecutionPlanNode } from "./nodes/createExecutionPlanNode.js";
import { executePlanNode } from "./nodes/executePlanNode.js";
import { finalizeResponseNode } from "./nodes/finalizeResponseNode.js";

/**
 * HAR Orchestration Graph (Phase 5)
 *
 * Flow:
 *   START → normalize → detectIntent → decideRoute → createPlan → executePlan → finalize → END
 *
 * The executePlan node internally handles LOCAL_ONLY, CLOUD_ONLY, and HYBRID pipelines,
 * keeping the graph shape clean while supporting multi-step execution.
 */
const builder = new StateGraph(HarWorkflowState)
  .addNode("normalizePrompt", normalizePromptNode)
  .addNode("detectIntent", detectIntentNode)
  .addNode("decideRoute", decideRouteNode)
  .addNode("createExecutionPlan", createExecutionPlanNode)
  .addNode("executePlan", executePlanNode)
  .addNode("finalizeResponse", finalizeResponseNode)

  // Linear flow — no conditional branching needed at graph level
  // The executePlan node handles plan interpretation internally
  .addEdge(START, "normalizePrompt")
  .addEdge("normalizePrompt", "detectIntent")
  .addEdge("detectIntent", "decideRoute")
  .addEdge("decideRoute", "createExecutionPlan")
  .addEdge("createExecutionPlan", "executePlan")
  .addEdge("executePlan", "finalizeResponse")
  .addEdge("finalizeResponse", END);

export const graph = builder.compile();
