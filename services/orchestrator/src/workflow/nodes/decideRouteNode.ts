import { createChildLogger } from "@har/logger";
import { routePrompt } from "../../decision/routePrompt.js";
import { HarWorkflowStateType } from "../state.js";

const logger = createChildLogger("workflow:route");

/**
 * Node: decideRoute
 * Applies the routing policy based on detected intent.
 */
export async function decideRouteNode(state: HarWorkflowStateType) {
  logger.info({ node: "decideRoute" }, "Entering decideRouteNode");
  
  if (!state.intent) {
    throw new Error("Missing intent for routing decision");
  }
  
  try {
    const route = routePrompt(state.intent);
    
    logger.info({ route }, "Route decided");
    
    return {
      route,
      logs: [`Route decided: ${route}`],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Routing decision failed";
    logger.error({ error: message }, "Routing decision failed");
    throw error;
  }
}
