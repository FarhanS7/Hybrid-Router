/**
 * Detects if a prompt asks for multiple distinct steps.
 * Examples: "fix and explain", "analyze then summarize", "clean and rewrite"
 */
export function isMultiStepPrompt(prompt: string): boolean {
  const p = prompt.toLowerCase();

  // Patterns indicating multi-step requests
  const multiStepPatterns = [
    /\b(fix|correct|clean)\b.*\b(explain|describe|tell)\b/,
    /\b(analyze|review)\b.*\b(summarize|sum up)\b/,
    /\b(rewrite|refactor)\b.*\b(explain|simplify)\b/,
    /\b(debug|fix)\b.*\b(optimize|improve)\b/,
    /\b(read|parse)\b.*\b(convert|transform)\b/,
    /\b(find|identify)\b.*\b(fix|resolve)\b/,
    /\b(redact|anonymize|clean)\b.*\b(explain|describe|analyze|design)\b/,
  ];

  const hasMultiStepPattern = multiStepPatterns.some(pattern => pattern.test(p));

  // Check for explicit conjunctions joining action verbs
  const actionVerbs = ["fix", "explain", "analyze", "summarize", "rewrite", "debug", "optimize", "simplify", "clean", "refactor", "convert", "review", "redact", "anonymize"];
  const conjunctions = [" and ", " then ", " also ", " plus "];

  let actionVerbCount = 0;
  for (const verb of actionVerbs) {
    if (p.includes(verb)) actionVerbCount++;
  }

  const hasConjunction = conjunctions.some(c => p.includes(c));

  return hasMultiStepPattern || (actionVerbCount >= 2 && hasConjunction);
}
