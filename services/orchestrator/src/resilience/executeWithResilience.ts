import { createChildLogger } from "@har/logger";
import { Route, Intent, ProviderResult, ErrorType } from "@har/shared";
import { withTimeout } from "./timeout.js";
import { classifyError } from "./classifyError.js";
import { shouldRetry } from "./shouldRetry.js";
import { shouldFallback } from "./shouldFallback.js";

const logger = createChildLogger("resilience:executor");

// Mapping routes to timeouts (could be moved to har/config later)
const TIMEOUTS: Record<Route, number> = {
  LOCAL: 15000,
  CLOUD: 12000,
  HYBRID: 20000, // Placeholder
};

interface ResilienceMeta {
  retryCount: number;
  fallbackUsed: boolean;
  errorType?: ErrorType;
  errorMessage?: string;
}

export interface ResilientExecutionResult {
  result: ProviderResult;
  resilience: ResilienceMeta;
}

/**
 * Executes a provider call with timeouts, retries, and fallbacks.
 */
export async function executeWithResilience(
  primaryRoute: Route,
  intent: Intent,
  prompt: string,
  adapters: {
    LOCAL: (prompt: string) => Promise<ProviderResult>;
    CLOUD: (prompt: string) => Promise<ProviderResult>;
  }
): Promise<ResilientExecutionResult> {
  let currentRoute = primaryRoute;
  let retryCount = 0;
  let fallbackUsed = false;
  let lastErrorType: ErrorType | undefined;
  let lastErrorMessage: string | undefined;

  // Outer loop handles fallback
  while (true) {
    // Inner loop handles retries
    try {
      const result = await withTimeout(
        adapters[currentRoute as "LOCAL" | "CLOUD"](prompt),
        TIMEOUTS[currentRoute],
        `${currentRoute} Execution`
      );

      // If success, return immediately
      return {
        result,
        resilience: {
          retryCount,
          fallbackUsed,
          errorType: lastErrorType,
          errorMessage: lastErrorMessage,
        },
      };
    } catch (error) {
      lastErrorType = classifyError(error);
      lastErrorMessage = error instanceof Error ? error.message : String(error);

      logger.warn(
        { route: currentRoute, retryCount, errorType: lastErrorType, error: lastErrorMessage },
        "Execution attempt failed"
      );

      // 1. Try Retry
      if (shouldRetry(lastErrorType, retryCount)) {
        retryCount++;
        logger.info({ route: currentRoute, retryCount }, "Retrying transient failure");
        continue; // Retry same route
      }

      // 2. Try Fallback (if not already on fallback and retry exhausted)
      if (!fallbackUsed) {
        const fallbackRoute = shouldFallback(currentRoute, intent);
        if (fallbackRoute) {
          logger.info({ from: currentRoute, to: fallbackRoute }, "Initiating fallback");
          currentRoute = fallbackRoute;
          fallbackUsed = true;
          retryCount = 0; // Reset retry count for the fallback route
          continue; // Try the fallback route
        } else if (currentRoute === "LOCAL" && intent.sensitive) {
          logger.error("Local failed and cloud fallback blocked by privacy policy");
        }
      }

      // 3. Exhausted all options
      logger.error({ route: currentRoute, errorType: lastErrorType }, "Execution failed after retries/fallback");
      
      const failureResult: ProviderResult = {
        provider: currentRoute as "LOCAL" | "CLOUD",
        output: getFailureMessage(lastErrorType, currentRoute, intent.sensitive),
        latencyMs: 0,
        success: false,
        errorType: lastErrorType,
        errorMessage: lastErrorMessage,
      };

      return {
        result: failureResult,
        resilience: {
          retryCount,
          fallbackUsed,
          errorType: lastErrorType,
          errorMessage: lastErrorMessage,
        },
      };
    }
  }
}

function getFailureMessage(errorType: ErrorType, route: Route, sensitive: boolean): string {
  if (route === "LOCAL" && sensitive) {
    return "HAR could not complete the request because the local provider failed and cloud fallback is disabled for sensitive prompts.";
  }
  return `HAR could not complete the request because both primary and fallback providers failed. (Error: ${errorType})`;
}
