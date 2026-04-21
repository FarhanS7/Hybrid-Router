import type { Intent, Route } from "@har/shared";

/**
 * V1 deterministic routing policy.
 *
 * Priority order:
 *  1. Privacy: sensitive prompts always stay local
 *  2. Task-specific: reasoning/architecture/debugging go to cloud
 *  3. Complexity: complex prompts go to cloud
 *  4. Default: everything else stays local (cheap/fast path)
 */
export function routePrompt(intent: Intent): Route {
  // Rule 1: Privacy dominates
  if (intent.sensitive) return "LOCAL";

  // Rule 2: Task-specific cloud routing
  if (intent.taskType === "reasoning") return "CLOUD";
  if (intent.taskType === "architecture") return "CLOUD";
  if (intent.taskType === "debugging") return "CLOUD";

  // Rule 3: Complexity-based cloud routing
  if (intent.complexity === "complex") return "CLOUD";

  // Rule 4: Default to local
  return "LOCAL";
}
