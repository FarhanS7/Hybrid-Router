/**
 * Detects if a prompt is messy/poorly structured.
 * Indicators: informal language, mixed commands, bad structure.
 */
export function isMessyPrompt(prompt: string): boolean {
  const p = prompt.toLowerCase();

  // Check for informal language patterns
  const informalPatterns = [
    /\bu\b/,         // "u" instead of "you"
    /\bplz\b/,       // "plz" instead of "please"
    /\bpls\b/,
    /\bgonna\b/,
    /\bwanna\b/,
    /\btbh\b/,
    /\bidk\b/,
    /\bcan u\b/,
    /\bhey\b.*\b(fix|help|do|make)\b/,
  ];

  const hasInformalLanguage = informalPatterns.some(pattern => pattern.test(p));

  // Check for multiple question marks or exclamation marks (messy punctuation)
  const hasMessyPunctuation = /[?!]{2,}/.test(prompt);

  // Check for very long unstructured sentences (no periods, just commas or "and")
  const hasRunOnSentence = p.length > 80 && !p.includes(".") && (p.split(",").length > 3 || p.split(" and ").length > 2);

  return hasInformalLanguage || hasMessyPunctuation || hasRunOnSentence;
}
