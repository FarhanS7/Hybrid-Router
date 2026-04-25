// ─── Route ───────────────────────────────────────────────
export type Route = "LOCAL" | "CLOUD" | "HYBRID";

// ─── Intent ──────────────────────────────────────────────
export type TaskType =
  | "greeting"
  | "rewrite"
  | "formatting"
  | "summary"
  | "code_help"
  | "debugging"
  | "reasoning"
  | "architecture"
  | "other";

export interface Intent {
  complexity: "simple" | "medium" | "complex";
  sensitive: boolean;
  taskType: TaskType;
  confidence: number;
  reason?: string;
}

// ─── Error ───────────────────────────────────────────────
export type ErrorType =
  | "TIMEOUT"
  | "RATE_LIMIT"
  | "PROVIDER_DOWN"
  | "NETWORK_ERROR"
  | "BAD_REQUEST"
  | "LOCAL_UNAVAILABLE"
  | "CLASSIFIER_FAILURE"
  | "UNKNOWN";

// ─── Provider ────────────────────────────────────────────
export interface ProviderResult {
  provider: "LOCAL" | "CLOUD";
  model?: string;
  output: string;
  latencyMs: number;
  success: boolean;
  errorType?: ErrorType;
  errorMessage?: string;
}

// ─── Execution Plan ──────────────────────────────────────
export type ExecutionStepType = "PREPROCESS" | "REASON" | "POSTPROCESS";

export interface ExecutionStep {
  step: ExecutionStepType;
  provider: "LOCAL" | "CLOUD";
}

export type ExecutionPlan =
  | { type: "LOCAL_ONLY" }
  | { type: "CLOUD_ONLY" }
  | { type: "HYBRID"; steps: ExecutionStep[] };

// ─── HAR Response ────────────────────────────────────────
export interface HybridStepResult {
  step: ExecutionStepType;
  provider: "LOCAL" | "CLOUD";
  success: boolean;
  latencyMs: number;
  errorType?: string;
}

export interface HarResponse {
  prompt: string;
  normalizedPrompt: string;

  route: Route; // initial planned route
  finalProvider: "LOCAL" | "CLOUD";
  model?: string;

  fallbackUsed: boolean;
  fallbackReason?: ErrorType | string;

  intent: Intent;
  result: string;
  latencyMs: number;
  success: boolean;

  routeReason?: string;

  planType?: "LOCAL_ONLY" | "CLOUD_ONLY" | "HYBRID";
  errorType?: ErrorType;
  errorMessage?: string;
  execution?: {
    mode: "SINGLE" | "HYBRID";
    steps?: HybridStepResult[];
  };
}

// ─── Request ─────────────────────────────────────────────
export interface PromptRequest {
  prompt: string;
}
