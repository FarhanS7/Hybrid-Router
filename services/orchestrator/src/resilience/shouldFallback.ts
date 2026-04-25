import { Route, Intent } from "@har/shared";
import { env } from "@har/config";

/**
 * Determines if/where to fallback based on failure and privacy rules.
 */
export function shouldFallback(
  primaryRoute: Route,
  intent: Intent
): Route | null {
  if (!env.ALLOW_CLOUD_FALLBACK && primaryRoute === "LOCAL") {
    return null;
  }

  // If CLOUD fails, we can ALWAYS safely fallback to LOCAL (Privacy is maintained)
  if (primaryRoute === "CLOUD") {
    return "LOCAL";
  }

  // If LOCAL fails, we only fallback to CLOUD if the prompt is NOT sensitive
  if (primaryRoute === "LOCAL") {
    if (intent.sensitive) {
      return null; // Privacy rule: No cloud fallback for sensitive data
    }
    return "CLOUD";
  }

  return null;
}
