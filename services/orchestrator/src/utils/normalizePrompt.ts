/**
 * Normalize a user prompt for consistent processing.
 *
 * Rules:
 *  - trim leading/trailing whitespace
 *  - collapse repeated internal whitespace to single space
 *  - preserve user meaning (no rewriting)
 *  - reject empty prompt
 */
export function normalizePrompt(raw: string): string {
  if (!raw || typeof raw !== "string") {
    throw new Error("Prompt must be a non-empty string");
  }

  const normalized = raw.trim().replace(/\s+/g, " ");

  if (normalized.length === 0) {
    throw new Error("Prompt must be a non-empty string");
  }

  return normalized;
}
