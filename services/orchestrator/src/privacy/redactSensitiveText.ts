import { SENSITIVITY_PATTERNS } from "./sensitivityPatterns.js";

/**
 * Replaces known sensitive values with [REDACTED].
 */
export function redactSensitiveText(input: string): string {
  let redacted = input;

  // Emails
  redacted = redacted.replace(SENSITIVITY_PATTERNS.email, "[REDACTED]");
  
  // Phones
  redacted = redacted.replace(SENSITIVITY_PATTERNS.phone, "[REDACTED]");
  
  // Credit Cards
  redacted = redacted.replace(SENSITIVITY_PATTERNS.creditCard, "[REDACTED]");
  
  // API Keys
  for (const pattern of Object.values(SENSITIVITY_PATTERNS.apiKey)) {
    redacted = redacted.replace(pattern, "[REDACTED]");
  }
  
  // Secrets
  redacted = redacted.replace(SENSITIVITY_PATTERNS.secrets, (match, p1) => {
    return `${p1}=[REDACTED]`;
  });

  return redacted;
}
