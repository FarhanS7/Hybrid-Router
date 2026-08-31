/**
 * Deterministic sensitivity classifier.
 *
 * This module handles all privacy-related classification. It must remain
 * entirely deterministic — no embeddings, no probabilistic matching.
 * You never want a probabilistic answer to "is this prompt sensitive?"
 *
 * Detection layers:
 *   1. Regex PII patterns (emails, phones, SSN, credit cards, API keys)
 *   2. Sensitive keyword matching (whole word, case insensitive)
 *   3. NER via compromise (person/place names in sensitive context only)
 *
 * Why compromise? It's a pure JS NLP library (~200KB, no Python/GPU).
 * We use it conservatively: a name alone doesn't flag — a name combined
 * with sensitive context words (salary, diagnosis, fired) does. This
 * prevents enormous false positives on normal prompts mentioning people.
 */
import { PII_PATTERNS, SENSITIVE_KEYWORDS } from "@har/shared";
import nlp from "compromise";

export interface SensitivityResult {
  sensitive: boolean;
  reason: string;
}

const SENSITIVE_CONTEXT_WORDS = /\b(salary|fired|complaint|diagnosis|medical|contract|confidential|terminated|disciplinary)\b/i;

export function classifySensitivity(prompt: string): SensitivityResult {
  // Check 1: Regex PII patterns (emails, phones, cards, SSN, API keys)
  for (const [name, pattern] of Object.entries(PII_PATTERNS)) {
    if (new RegExp(pattern.source, pattern.flags).test(prompt)) {
      return { sensitive: true, reason: `PII pattern detected: ${name}` };
    }
  }

  // Check 2: Sensitive keyword (whole word match, case insensitive)
  for (const kw of SENSITIVE_KEYWORDS) {
    if (new RegExp(`\\b${kw}\\b`, "i").test(prompt)) {
      return { sensitive: true, reason: `Sensitive keyword: "${kw}"` };
    }
  }

  // Check 3: NER — named people/places in sensitive context
  try {
    const doc = nlp(prompt);
    const hasPerson = doc.people().length > 0;
    const hasPlace = doc.places().length > 0;

    if ((hasPerson || hasPlace) && SENSITIVE_CONTEXT_WORDS.test(prompt)) {
      return { sensitive: true, reason: "NER: named entity in sensitive context" };
    }
  } catch {
    // compromise parse failure is not a security failure — continue safely
  }

  return { sensitive: false, reason: "No sensitive data detected" };
}
