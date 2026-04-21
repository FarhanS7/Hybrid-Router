import { ErrorType } from "@har/shared";

/**
 * Classifies raw errors into HAR ErrorTypes.
 * Works with Fetch errors, local service errors, and provider responses.
 */
export function classifyError(error: unknown): ErrorType {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  // 1. Timeout errors
  if (message.includes("timeout") || message.includes("deadline")) {
    return "TIMEOUT";
  }

  // 2. Local Availability (Ollama specific)
  if (message.includes("econnrefused") || message.includes("fetch failed")) {
    // If it's a fetch failure and we were trying local, it's likely local unavailable
    // This is a heuristic that works well for our specific architecture.
    return "LOCAL_UNAVAILABLE";
  }

  // 3. Provider/Network specific hints
  if (message.includes("429") || message.includes("rate limit")) {
    return "RATE_LIMIT";
  }

  if (message.includes("500") || message.includes("502") || message.includes("503") || message.includes("504")) {
    return "PROVIDER_DOWN";
  }

  if (message.includes("400") || message.includes("bad request") || message.includes("invalid")) {
    return "BAD_REQUEST";
  }

  // 4. Intent Classifier failure
  if (message.includes("classifier") || message.includes("intent-service")) {
    return "CLASSIFIER_FAILURE";
  }

  return "UNKNOWN";
}
