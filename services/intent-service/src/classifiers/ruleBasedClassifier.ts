import type { TaskType, Intent } from "@har/shared";
import nlp from "compromise";

// ─── Keyword dictionaries ────────────────────────────────

const SENSITIVE_KEYWORDS = [
  "password", "api key", "apikey", "secret", "salary",
  "bank", "contract", "personal", "private", "resume",
  "medical", "ssn", "social security", "credit card",
];

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

// ─── Helpers ─────────────────────────────────────────────

// ─── Regex patterns for PII ──────────────────────────────
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
};

function detectProsePII(text: string): boolean {
  try {
    const doc = nlp(text);
    return doc.people().length > 0 || doc.places().length > 0;
  } catch {
    return false;
  }
}

function detectTaskType(prompt: string): { taskType: TaskType; confidence: number } {
  const lower = prompt.toLowerCase();

  // Score each task type by keyword matches
  let bestTask: TaskType = "other";
  let bestScore = 0;

  for (const [task, keywords] of Object.entries(TASK_KEYWORDS) as [TaskType, string[]][]) {
    if (task === "other") continue;

    let matchCount = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) matchCount++;
    }

    if (matchCount > bestScore) {
      bestScore = matchCount;
      bestTask = task;
    }
  }

  // Determine confidence based on match strength
  let confidence: number;
  if (bestScore >= 2) {
    confidence = 0.9;
  } else if (bestScore === 1) {
    confidence = 0.7;
  } else {
    confidence = 0.5;
  }

  return { taskType: bestTask, confidence };
}

function scoreComplexity(taskType: TaskType, wordCount: number): "simple" | "medium" | "complex" {
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

// ─── Public API ──────────────────────────────────────────

/**
 * Refined rule-based classifier for better deterministic routing.
 */
export function classifyIntent(prompt: string): Intent {
  const lower = prompt.toLowerCase();
  
  // 1. Detect Sensitivity (Privacy First)
  let sensitive = false;
  let sensitivityReason = "";
  
  const hasPII = Object.values(PII_PATTERNS).some(regex => {
    const match = prompt.match(regex);
    return match && match.length > 0;
  });
  
  const sensitiveKeyword = SENSITIVE_KEYWORDS.find(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    return regex.test(prompt);
  });

  const hasProsePII = detectProsePII(prompt);

  if (hasPII) {
    sensitive = true;
    sensitivityReason = "Pattern-based PII detected (email/phone/SSN/card)";
  } else if (sensitiveKeyword) {
    sensitive = true;
    sensitivityReason = `Sensitive keyword detected: "${sensitiveKeyword}"`;
  } else if (hasProsePII) {
    sensitive = true;
    sensitivityReason = "Prose-based PII detected (Person/Place)";
  }

  // 2. Detect Task Type (Priority-based)
  let taskType: TaskType = "other";
  let bestScore = 0;
  let matchReason = "No specific task keywords found";

  for (const [task, keywords] of Object.entries(TASK_KEYWORDS) as [TaskType, string[]][]) {
    if (task === "other") continue;

    let matches: string[] = [];
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, "i");
      if (regex.test(prompt)) matches.push(kw);
    }

    // Heuristic: Priority tasks get a boost
    let score = matches.length;
    if (COMPLEX_TASKS.includes(task)) score *= 1.2;

    if (score > bestScore) {
      bestScore = score;
      taskType = task;
      matchReason = `Matched ${task} keywords: [${matches.join(", ")}]`;
    }
  }

  // 3. Determine Complexity
  const wordCount = prompt.split(/\s+/).length;
  let complexity: "simple" | "medium" | "complex" = scoreComplexity(taskType, wordCount);
  
  // Complexity overrides
  if (wordCount > 100) complexity = "complex";

  // 4. Assemble Final Reason
  const reasonParts = [
    `Task: ${taskType} (${matchReason})`,
    sensitive ? `Privacy: ${sensitivityReason}` : "Privacy: No sensitive data detected",
    `Complexity: ${complexity} (${wordCount} words)`,
  ];

  return {
    complexity,
    sensitive,
    taskType,
    confidence: bestScore > 0 ? Math.min(0.5 + (bestScore * 0.2), 0.95) : 0.5,
    reason: reasonParts.join(" | "),
  };
}
