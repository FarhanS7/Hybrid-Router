/**
 * Keyword-based task type classifier — the original V2 logic.
 *
 * This is the FALLBACK classifier. It's used when:
 *   1. The embedding engine hasn't loaded yet (startup)
 *   2. Embedding confidence is below the threshold (< 0.55)
 *
 * It's deterministic and fast but misses paraphrased prompts.
 * "design a scalable notification system" → architecture ✓
 * "how should I structure my backend services?" → other ✗ (no keyword hit)
 */
import type { TaskType } from "@har/shared";

// ─── Keyword dictionaries ────────────────────────────────
const TASK_KEYWORDS: Record<TaskType, string[]> = {
  greeting:     ["hello", "hi", "hey", "good morning", "good evening", "howdy", "greetings"],
  rewrite:      ["rewrite", "rephrase", "paraphrase", "reword", "recraft"],
  formatting:   ["format", "prettify", "indent", "markdown", "table format", "beautify"],
  summary:      ["summarize", "summary", "tldr", "tl;dr", "brief", "shorten", "condense"],
  code_help:    ["code", "function", "implement", "write a script", "snippet", "regex", "algorithm"],
  debugging:    ["debug", "fix", "error", "bug", "stacktrace", "stack trace", "traceback", "exception", "troubleshoot"],
  reasoning:    ["reason", "reasoning", "explain why", "think through", "logic", "analyze", "evaluate", "compare and contrast"],
  architecture: ["architect", "architecture", "system design", "design a", "scalable", "microservice", "infrastructure", "high availability", "distributed"],
  other:        [],
};

const COMPLEX_TASKS: TaskType[] = ["architecture", "debugging", "reasoning"];

export interface KeywordClassificationResult {
  taskType: TaskType;
  confidence: number;
  method: "keyword-fallback";
}

/**
 * Classify task type by keyword matching.
 * Returns the task type with the highest keyword match score.
 */
export function keywordFallbackClassify(prompt: string): KeywordClassificationResult {
  const lower = prompt.toLowerCase();

  let bestTask: TaskType = "other";
  let bestScore = 0;

  for (const [task, keywords] of Object.entries(TASK_KEYWORDS) as [TaskType, string[]][]) {
    if (task === "other") continue;

    let score = 0;
    for (const kw of keywords) {
      if (new RegExp(`\\b${kw}\\b`, "i").test(lower)) score++;
    }

    // Boost complex tasks — they're more likely to be the true intent
    if (COMPLEX_TASKS.includes(task)) score *= 1.2;

    if (score > bestScore) {
      bestScore = score;
      bestTask = task;
    }
  }

  return {
    taskType: bestTask,
    confidence: bestScore > 0 ? Math.min(0.5 + (bestScore * 0.2), 0.95) : 0.5,
    method: "keyword-fallback",
  };
}

/**
 * Score prompt complexity based on task type weight + word count.
 */
export function scoreComplexity(taskType: TaskType, wordCount: number): "simple" | "medium" | "complex" {
  const taskWeights: Record<TaskType, number> = {
    greeting: 0,
    rewrite: 1,
    formatting: 1,
    summary: 2,
    code_help: 3,
    debugging: 4,
    reasoning: 4,
    architecture: 5,
    other: 2,
  };
  const score = (taskWeights[taskType] ?? 2) + Math.floor(wordCount / 20);
  if (score >= 7) return "complex";
  if (score >= 3) return "medium";
  return "simple";
}
