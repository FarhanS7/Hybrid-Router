import { createChildLogger } from "@har/logger";
import { routePrompt } from "../../decision/routePrompt.js";
import { HarWorkflowStateType } from "../state.js";

const logger = createChildLogger("workflow:route");

/**
 * Node: decideRoute
 * Applies the V2 routing policy (LOCAL / CLOUD / HYBRID).
 */
export async function decideRouteNode(state: HarWorkflowStateType) {
  logger.info({ node: "decideRoute" }, "Entering decideRouteNode");

  if (!state.intent) {
    throw new Error("Missing intent for routing decision");
  }

  const prompt = state.normalizedPrompt || state.prompt;
  const { route, reason } = routePrompt(state.intent, prompt);

  logger.info({ stage: "route_selected", route, reason }, "Route decided");

  return {
    route,
    routingReason: reason,
    logs: [`Route decided: ${route} (${reason})`],
  };
}
