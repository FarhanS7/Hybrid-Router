import { Intent } from "@har/shared";

/**
 * Conservative fallback intent when the intent-service is unavailable.
 * Uses simple heuristics on the prompt to decide a safe route.
 */
export function getFallbackIntent(prompt: string): Intent {
  const p = prompt.toLowerCase();
  
  // 1. Sensitive Check (Conservative)
  const sensitiveKeywords = ["password", "salary", "ssn", "private", "secret", "cvv", "key"];
  const isSensitive = sensitiveKeywords.some(k => p.includes(k));
  
  // 2. Complexity/Task Type Check (Heuristic)
  let taskType: Intent["taskType"] = "other";
  let complexity: Intent["complexity"] = "simple";
  
  if (p.includes("architecture") || p.includes("design") || p.includes("system")) {
    taskType = "architecture";
    complexity = "complex";
  } else if (p.includes("debug") || p.includes("error") || p.includes("fix")) {
    taskType = "debugging";
    complexity = "medium";
  } else if (p.includes("reason") || p.includes("why") || p.includes("explain")) {
    taskType = "reasoning";
    complexity = "complex";
  }

  return {
    complexity,
    sensitive: isSensitive,
    taskType,
    confidence: 0.5, // Low confidence for heuristics
  };
}
