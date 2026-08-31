/**
 * Intent classifier coordinator (V3).
 *
 * This file is a thin coordinator that delegates to:
 *   - sensitivityClassifier.ts  → deterministic PII/privacy detection
 *   - keywordFallback.ts        → keyword-based task type classification
 *
 * In Commit 3, this will be upgraded to use the embedding engine
 * with keyword fallback only for low-confidence results.
 *
 * Separation rationale: sensitivity detection (must be deterministic)
 * and task classification (should be semantic) have opposite requirements.
 */
import type { Intent } from "@har/shared";
import { classifySensitivity } from "./sensitivityClassifier.js";
import { keywordFallbackClassify, scoreComplexity } from "./keywordFallback.js";

/**
 * Classify prompt intent for routing decisions.
 * Currently synchronous (keyword-only). Will become async in Commit 3
 * when embedding engine is added.
 */
export function classifyIntent(prompt: string): Intent {
  // 1. Sensitivity is always deterministic — never probabilistic
  const { sensitive, reason: sensitivityReason } = classifySensitivity(prompt);

  // 2. Task type via keyword matching (embedding upgrade in Commit 3)
  const { taskType, confidence } = keywordFallbackClassify(prompt);

  // 3. Complexity scoring
  const wordCount = prompt.split(/\s+/).length;
  let complexity = scoreComplexity(taskType, wordCount);
  if (wordCount > 100) complexity = "complex";

  // 4. Assemble reason string
  const reason = [
    `Task: ${taskType} via keyword-fallback (score: ${confidence.toFixed(2)})`,
    `Privacy: ${sensitivityReason}`,
    `Complexity: ${complexity} (${wordCount} words)`,
  ].join(" | ");

  return {
    complexity,
    sensitive,
    taskType,
    confidence,
    reason,
  };
}
