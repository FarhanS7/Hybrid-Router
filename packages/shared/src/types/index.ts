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

// ─── Provider ────────────────────────────────────────────
export interface ProviderResult {
  provider: "LOCAL" | "CLOUD";
  model?: string;
  output: string;
  latencyMs: number;
  success: boolean;
  errorType?: string;
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
}

// ─── Request ─────────────────────────────────────────────
export interface PromptRequest {
  prompt: string;
}
