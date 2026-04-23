import type { Intent, Route } from "@har/shared";
import { shouldUseHybrid } from "./shouldUseHybrid.js";

/**
 * V2 deterministic routing policy.
 *
 * Priority order:
 *  1. Hybrid eligibility check (must be checked before privacy override)
 *  2. Privacy: sensitive prompts stay local (unless hybrid redaction is justified)
 *  3. Task-specific: reasoning/architecture/debugging go to cloud
 *  4. Complexity: complex prompts go to cloud
 *  5. Default: everything else stays local (cheap/fast path)
 */
export function routePrompt(intent: Intent, prompt: string = ""): Route {
  // Rule 0: Check hybrid eligibility first
  // This must come before the sensitive-only-local rule because
  // hybrid can safely handle sensitive data via local redaction → cloud reasoning
  if (prompt && shouldUseHybrid(prompt, intent)) {
    return "HYBRID";
  }

  // Rule 1: Privacy dominates (for non-hybrid paths)
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
