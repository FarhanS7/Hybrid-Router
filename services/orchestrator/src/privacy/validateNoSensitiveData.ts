import { SENSITIVITY_PATTERNS } from "./sensitivityPatterns.js";

/**
 * Returns false if any known sensitive patterns remain in the text.
 */
export function validateNoSensitiveData(input: string): boolean {
  if (input.match(SENSITIVITY_PATTERNS.email)) return false;
  if (input.match(SENSITIVITY_PATTERNS.phone)) return false;
  if (input.match(SENSITIVITY_PATTERNS.creditCard)) return false;
  
  for (const pattern of Object.values(SENSITIVITY_PATTERNS.apiKey)) {
    if (input.match(pattern)) return false;
  }
  
  if (input.match(SENSITIVITY_PATTERNS.secrets)) return false;

  return true;
}
