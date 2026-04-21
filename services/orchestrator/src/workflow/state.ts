import { Annotation } from "@langchain/langgraph";
import type { HarResponse, Intent, ProviderResult, Route, ErrorType } from "@har/shared";

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
  
  // Provider Result
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
