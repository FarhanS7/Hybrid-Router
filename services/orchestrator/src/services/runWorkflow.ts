import { createChildLogger } from "@har/logger";
import type { HarResponse } from "@har/shared";
import { graph } from "../workflow/graph.js";

const logger = createChildLogger("orchestrator:workflow");

/**
 * Executes the LangGraph orchestration workflow.
 */
export async function runWorkflow(prompt: string): Promise<HarResponse> {
  const totalStart = Date.now();
  logger.info({ prompt: prompt.substring(0, 50) }, "Starting workflow execution");
  
  try {
    // Invoke the graph with the initial state
    const finalState = await graph.invoke({ prompt });
    
    if (!finalState.finalResponse) {
      throw new Error("Workflow completed without producing a final response");
    }
    
    const totalLatency = Date.now() - totalStart;
    
    // Log final summary
    logger.info({
      stage: "workflow_complete",
      route: finalState.route,
      provider: finalState.providerResult?.provider,
      totalLatencyMs: totalLatency,
      success: finalState.finalResponse.success,
    }, "Workflow completed successfully");
    
    return {
      ...finalState.finalResponse,
      latencyMs: totalLatency, // Overwrite with actual end-to-end latency including orchestration
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workflow execution failed";
    logger.error({ error: message }, "Workflow execution failed");
    throw error;
  }
}
