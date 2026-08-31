/**
 * Unified sensitivity patterns for PII detection.
 * Shared across intent-service and orchestrator — single source of truth.
 *
 * Two exports:
 *   - PII_PATTERNS: flat map of name → RegExp (used by intent-service)
 *   - SENSITIVITY_PATTERNS: legacy shape with nested apiKey (used by orchestrator)
 *
 * These are DETERMINISTIC patterns. Never use probabilistic matching
 * for privacy-critical decisions.
 */

// ─── Flat PII pattern map (new, preferred) ──────────────
export const PII_PATTERNS: Record<string, RegExp> = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  openaiKey: /sk-[a-zA-Z0-9]{48}/g,
  googleKey: /AIza[0-9A-Za-z-_]{35}/g,
  githubToken: /ghp_[a-zA-Z0-9]{36}/g,
  slackToken: /xox[baprs]-[a-zA-Z0-9-]{10,}/g,
  inlineSecret: /\b(password|token|api_key|secret|credential)\s*[:=]\s*["']?[a-zA-Z0-9!@#$%^&*()_+=-]{4,}["']?/gi,
  dbUri: /[a-zA-Z0-9+]+:\/\/[^:\s]+:[^@\s]+@[^/\s]+/g,
};

// ─── Legacy shape (backward-compatible with orchestrator) ─
export const SENSITIVITY_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  dbUri: /[a-zA-Z0-9+]+:\/\/[^:\s]+:[^@\s]+@[^/\s]+/g,
  apiKey: {
    openai: /sk-[a-zA-Z0-9]{48}/g,
    google: /AIza[0-9A-Za-z-_]{35}/g,
    github: /ghp_[a-zA-Z0-9]{36}/g,
    slack: /xox[baprs]-[a-zA-Z0-9-]{10,}/g,
  },
  secrets: /\b(password|token|api_key|secret|credential)\s*[:=]\s*["']?[a-zA-Z0-9!@#$%^&*()_+=-]{4,}["']?/gi,
};

// ─── Sensitive keyword list ─────────────────────────────
export const SENSITIVE_KEYWORDS = [
  "password", "api key", "apikey", "secret", "salary",
  "bank", "contract", "personal", "private", "resume",
  "medical", "ssn", "social security", "credit card",
  "private key", "bearer token",
];
