import { StateGraph, START, END } from "@langchain/langgraph";
import { HarWorkflowState } from "./state.js";
import { normalizePromptNode } from "./nodes/normalizePromptNode.js";
import { detectIntentNode } from "./nodes/detectIntentNode.js";
import { decideRouteNode } from "./nodes/decideRouteNode.js";
import { executeRouteNode } from "./nodes/executeRouteNode.js";
import { executeHybridNode } from "./nodes/executeHybridNode.js";
import { finalizeResponseNode } from "./nodes/finalizeResponseNode.js";

// Conditional routing function
const routeDecision = (state: typeof HarWorkflowState.State) => {
  if (state.route === "HYBRID") return "hybrid";
  if (state.route === "LOCAL") return "single_route";
  if (state.route === "CLOUD") return "single_route";
  return "single_route"; // Default fallback
};

/**
 * HAR Orchestration Graph (Phase 5)
 *
 * Flow:
 *   START
 *    → normalize
 *    → detectIntent
 *    → decideRoute
 *      ├─ LOCAL/CLOUD  → executeRoute
 *      └─ HYBRID       → executeHybrid
 *    → finalize
 *    → END
 */
const builder = new StateGraph(HarWorkflowState)
  .addNode("normalizePrompt", normalizePromptNode)
  .addNode("detectIntent", detectIntentNode)
  .addNode("decideRoute", decideRouteNode)
  .addNode("executeRoute", executeRouteNode)
  .addNode("executeHybrid", executeHybridNode)
  .addNode("finalizeResponse", finalizeResponseNode)

  // Linear flow up to decision
  .addEdge(START, "normalizePrompt")
  .addEdge("normalizePrompt", "detectIntent")
  .addEdge("detectIntent", "decideRoute")
  
  // Conditional branching based on route
  .addConditionalEdges("decideRoute", routeDecision, {
    single_route: "executeRoute",
    hybrid: "executeHybrid",
  })
  
  // Re-join at finalize
  .addEdge("executeRoute", "finalizeResponse")
  .addEdge("executeHybrid", "finalizeResponse")
  
  .addEdge("finalizeResponse", END);

export const graph = builder.compile();
