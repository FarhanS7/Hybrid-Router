/**
 * Intent classifier coordinator (V3).
 *
 * Combines:
 *   - sensitivityClassifier.ts → deterministic PII/privacy detection
 *   - embeddingEngine.ts       → semantic prompt similarity (all-MiniLM-L6-v2)
 *   - keywordFallback.ts       → keyword matching fallback (when confidence < 0.55)
 */
import type { Intent } from "@har/shared";
import { classifySensitivity } from "./sensitivityClassifier.js";
import {
  classifyByEmbedding,
  isEmbeddingEngineReady,
} from "./embeddingEngine.js";
import { keywordFallbackClassify, scoreComplexity } from "./keywordFallback.js";

const CONFIDENCE_THRESHOLD = 0.55;

export async function classifyIntent(prompt: string): Promise<Intent> {
  // 1. Sensitivity is always deterministic — never probabilistic
  const { sensitive, reason: sensitivityReason } = classifySensitivity(prompt);

  // 2. Semantic embedding classification with keyword fallback
  let taskType: Intent["taskType"] = "other";
  let confidence = 0.5;
  let classifierMethod: "embedding" | "keyword-fallback" = "keyword-fallback";

  if (isEmbeddingEngineReady()) {
    try {
      const embeddingRes = await classifyByEmbedding(prompt);
      if (embeddingRes.confidence >= CONFIDENCE_THRESHOLD) {
        taskType = embeddingRes.taskType;
        confidence = embeddingRes.confidence;
        classifierMethod = "embedding";
      } else {
        // Low embedding confidence — fall back to keyword classifier
        const fallbackRes = keywordFallbackClassify(prompt);
        taskType = fallbackRes.taskType;
        confidence = fallbackRes.confidence;
        classifierMethod = "keyword-fallback";
      }
    } catch {
      const fallbackRes = keywordFallbackClassify(prompt);
      taskType = fallbackRes.taskType;
      confidence = fallbackRes.confidence;
      classifierMethod = "keyword-fallback";
    }
  } else {
    // Engine not ready yet (e.g. startup) — use keyword fallback
    const fallbackRes = keywordFallbackClassify(prompt);
    taskType = fallbackRes.taskType;
    confidence = fallbackRes.confidence;
    classifierMethod = "keyword-fallback";
  }

  // 3. Complexity scoring
  const wordCount = prompt.split(/\s+/).length;
  let complexity = scoreComplexity(taskType, wordCount);
  if (wordCount > 100) complexity = "complex";

  // 4. Assemble reason string
  const reason = [
    `Task: ${taskType} via ${classifierMethod} (conf: ${confidence.toFixed(2)})`,
    `Privacy: ${sensitivityReason}`,
    `Complexity: ${complexity} (${wordCount} words)`,
  ].join(" | ");

  return {
    complexity,
    sensitive,
    taskType,
    confidence,
    reason,
    classifierMethod,
    classifierVersion: "v3-embedding",
  };
}
