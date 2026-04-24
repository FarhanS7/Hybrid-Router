import type { TaskType, Intent } from "@har/shared";

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

const SIMPLE_TASKS: TaskType[] = ["greeting", "rewrite", "formatting", "summary"];
const COMPLEX_TASKS: TaskType[] = ["architecture", "debugging", "reasoning"];

// ─── Helpers ─────────────────────────────────────────────

// ─── Regex patterns for PII ──────────────────────────────
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
};

function detectSensitivity(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  
  // 1. Keyword match
  const hasKeyword = SENSITIVE_KEYWORDS.some((kw) => lower.includes(kw));
  if (hasKeyword) return true;

  // 2. Pattern match
  const hasPattern = Object.values(PII_PATTERNS).some((regex) => regex.test(prompt));
  return hasPattern;
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

function detectComplexity(taskType: TaskType, prompt: string): "simple" | "medium" | "complex" {
  if (COMPLEX_TASKS.includes(taskType)) return "complex";
  if (SIMPLE_TASKS.includes(taskType)) return "simple";

  // Length-based heuristic for ambiguous cases
  const wordCount = prompt.split(/\s+/).length;
  if (wordCount > 50) return "complex";
  if (wordCount > 20) return "medium";

  return "medium";
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

  if (hasPII) {
    sensitive = true;
    sensitivityReason = "Pattern-based PII detected (email/phone/SSN/card)";
  } else if (sensitiveKeyword) {
    sensitive = true;
    sensitivityReason = `Sensitive keyword detected: "${sensitiveKeyword}"`;
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
  let complexity: "simple" | "medium" | "complex" = detectComplexity(taskType, prompt);
  
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
