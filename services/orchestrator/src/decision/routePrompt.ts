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
export interface RouteDecision {
  route: Route;
  reason: string;
}

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
export function routePrompt(intent: Intent, prompt: string = ""): RouteDecision {
  // Rule 0: Check hybrid eligibility first
  if (prompt && shouldUseHybrid(prompt, intent)) {
    return { 
      route: "HYBRID", 
      reason: "Workflow: multi-step logic required (hybrid redaction + cloud reasoning)" 
    };
  }

  // Rule 1: Privacy dominates
  if (intent.sensitive) {
    return { 
      route: "LOCAL", 
      reason: "Privacy: sensitive prompt restricted to local execution" 
    };
  }

  // Rule 2: Task-specific cloud routing
  if (intent.taskType === "reasoning" || intent.taskType === "architecture" || intent.taskType === "debugging") {
    return { 
      route: "CLOUD", 
      reason: `Intelligence: ${intent.taskType} task requires cloud-level reasoning` 
    };
  }

  // Rule 3: Complexity-based cloud routing
  if (intent.complexity === "complex") {
    return { 
      route: "CLOUD", 
      reason: "Intelligence: high complexity prompt requires cloud-level reasoning" 
    };
  }

  // Rule 4: Default to local
  return { 
    route: "LOCAL", 
    reason: "Efficiency: simple task routed to local provider for speed/cost" 
  };
}
