import { Annotation } from "@langchain/langgraph";
import type { ExecutionPlan, HarResponse, Intent, ProviderResult, Route, ErrorType, HybridStepResult } from "@har/shared";

/**
 * HAR Workflow State Definition.
 * This state is passed between nodes in the LangGraph workflow.
 */
export const HarWorkflowState = Annotation.Root({
  // Initial Input
  prompt: Annotation<string>(),
  
  // Intermediate State
  normalizedPrompt: Annotation<string>(),
  intent: Annotation<Intent>(),
  route: Annotation<Route>(),
  
  // Execution Plan (Phase 5)
  executionPlan: Annotation<ExecutionPlan>(),
  stepResults: Annotation<ProviderResult[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  hybridSteps: Annotation<HybridStepResult[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  
  // Provider Result (final or primary)
  providerResult: Annotation<ProviderResult>(),
  
  // Resilience Metadata
  errorType: Annotation<ErrorType>(),
  errorMessage: Annotation<string>(),
  retryCount: Annotation<number>(),
  fallbackUsed: Annotation<boolean>(),
  
  // Final Output
  finalResponse: Annotation<HarResponse>(),
  
  // Execution Metadata & Logs
  logs: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

export type HarWorkflowStateType = typeof HarWorkflowState.State;
