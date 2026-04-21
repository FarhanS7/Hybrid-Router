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

// ─── HAR Response ────────────────────────────────────────
export interface HarResponse {
  prompt: string;
  normalizedPrompt: string;
  intent: Intent;
  route: Route;
  result: string;
  model?: string;
  latencyMs: number;
  success: boolean;
  fallbackUsed: boolean;
  errorType?: ErrorType;
  errorMessage?: string;
}

// ─── Request ─────────────────────────────────────────────
export interface PromptRequest {
  prompt: string;
}
