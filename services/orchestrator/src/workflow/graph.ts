import { StateGraph, START, END } from "@langchain/langgraph";
import { HarWorkflowState } from "./state.js";
import { normalizePromptNode } from "./nodes/normalizePromptNode.js";
import { detectIntentNode } from "./nodes/detectIntentNode.js";
import { decideRouteNode } from "./nodes/decideRouteNode.js";
import { executeLocalNode } from "./nodes/executeLocalNode.js";
import { executeCloudNode } from "./nodes/executeCloudNode.js";
import { finalizeResponseNode } from "./nodes/finalizeResponseNode.js";

// Routing logic
const routeDecision = (state: typeof HarWorkflowState.State) => {
  if (state.route === "LOCAL") return "local";
  if (state.route === "CLOUD") return "cloud";
  return "local"; // Default/Fallback
};

// Graph construction
const builder = new StateGraph(HarWorkflowState)
  .addNode("normalizePrompt", normalizePromptNode)
  .addNode("detectIntent", detectIntentNode)
  .addNode("decideRoute", decideRouteNode)
  .addNode("executeLocal", executeLocalNode)
  .addNode("executeCloud", executeCloudNode)
  .addNode("finalizeResponse", finalizeResponseNode)
  
  // Edge definitions
  .addEdge(START, "normalizePrompt")
  .addEdge("normalizePrompt", "detectIntent")
  .addEdge("detectIntent", "decideRoute")
  
  // Conditional routing
  .addConditionalEdges("decideRoute", routeDecision, {
    local: "executeLocal",
    cloud: "executeCloud",
  })
  
  // Closing the branches
  .addEdge("executeLocal", "finalizeResponse")
  .addEdge("executeCloud", "finalizeResponse")
  .addEdge("finalizeResponse", END);

export const graph = builder.compile();
