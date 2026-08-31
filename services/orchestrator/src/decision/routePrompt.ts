import type { Intent, Route } from "@har/shared";
import { env } from "@har/config";
import { shouldUseHybrid } from "./shouldUseHybrid.js";

export interface RouteDecision {
  route: Route;
  reason: string;
}

function routeCodeDomain(intent: Intent, prompt: string): RouteDecision {
  // Sensitive code (contains API keys, credentials) → always LOCAL
  if (intent.sensitive) {
    return { route: "LOCAL", reason: "Code Domain: sensitive code/credentials restricted to local execution" };
  }

  // Simple autocomplete & snippets → LOCAL (speed matters most)
  if (intent.taskType === "code_help" && intent.complexity === "simple") {
    return { route: "LOCAL", reason: "Code Domain: simple autocomplete/snippet routed to local for speed" };
  }

  // Debugging & architecture → CLOUD (reasoning quality matters)
  if (intent.taskType === "debugging" || intent.taskType === "architecture") {
    return { route: "CLOUD", reason: `Code Domain: ${intent.taskType} requires cloud-grade reasoning` };
  }

  // Complex refactoring → CLOUD
  if (intent.taskType === "rewrite" && intent.complexity === "complex") {
    return { route: "CLOUD", reason: "Code Domain: complex code refactoring requires cloud reasoning" };
  }

  return { route: "LOCAL", reason: "Code Domain: defaulting to local provider" };
}

export function routePrompt(intent: Intent, prompt: string = ""): RouteDecision {
  // Check code domain routing policy first if DOMAIN=code
  if (env.DOMAIN === "code") {
    return routeCodeDomain(intent, prompt);
  }

  // Rule 0: Check hybrid eligibility first
  if (prompt && shouldUseHybrid(prompt, intent)) {
    return { 
      route: "HYBRID", 
      reason: "Workflow: multi-step logic required (hybrid redaction + cloud reasoning)" 
    };
  }

  // Rule 1: Privacy dominates (unconditional local restriction)
  if (intent.sensitive) {
    return { 
      route: "LOCAL", 
      reason: "Privacy: sensitive prompt restricted to local execution" 
    };
  }

  // Rule 1.5: Confidence gate (uncertain embedding classifications default to LOCAL)
  const LOW_CONFIDENCE_THRESHOLD = 0.52;
  if (intent.confidence < LOW_CONFIDENCE_THRESHOLD && intent.classifierMethod === "embedding") {
    return {
      route: "LOCAL",
      reason: `Confidence: low classifier confidence (${intent.confidence.toFixed(2)}) — defaulting to local for safety`,
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
