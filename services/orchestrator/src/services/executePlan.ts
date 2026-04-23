import { createChildLogger } from "@har/logger";
import type { ExecutionPlan, ExecutionStep, Intent, ProviderResult, HybridStepResult } from "@har/shared";
import { generateLocal } from "../clients/localLlmClient.js";
import { generateCloud } from "../clients/cloudLlmClient.js";
import { executeWithResilience, ResilientExecutionResult } from "../resilience/executeWithResilience.js";

const logger = createChildLogger("executor:plan");

const adapters = {
  LOCAL: generateLocal,
  CLOUD: generateCloud,
};

/**
 * Prompt shaping templates for hybrid steps.
 * Keeps it simple and deterministic for Phase 5.
 */
const STEP_PROMPTS: Record<string, (input: string) => string> = {
  PREPROCESS: (input) =>
    `Clean up, restructure, and REDACT all sensitive information from the following text. Replace any PII, names, secrets, or specific identifiers with generic placeholders like [REDACTED]. Only output the improved and redacted text, nothing else.\n\nInput:\n${input}`,
  REASON: (input) =>
    input, // Pass through — the preprocessed prompt IS the reasoning input
  POSTPROCESS: (input) =>
    `Simplify and reformat the following response to make it clearer and more concise. Keep the meaning intact but make it easier to understand.\n\nInput:\n${input}`,
};

export interface PlanExecutionResult {
  finalResult: ProviderResult;
  stepResults: ProviderResult[];
  hybridSteps?: HybridStepResult[];
  fallbackUsed: boolean;
  totalLatencyMs: number;
}

/**
 * Executes a plan (LOCAL_ONLY, CLOUD_ONLY, or HYBRID).
 * Each step uses Phase 4 resilience-aware execution.
 */
export async function executePlan(
  plan: ExecutionPlan,
  prompt: string,
  intent: Intent
): Promise<PlanExecutionResult> {
  if (plan.type === "LOCAL_ONLY") {
    return executeSingleStep("LOCAL", prompt, intent);
  }

  if (plan.type === "CLOUD_ONLY") {
    return executeSingleStep("CLOUD", prompt, intent);
  }

  // HYBRID execution
  return executeHybridPlan(plan.steps, prompt, intent);
}

/**
 * Single-step execution with full resilience.
 */
async function executeSingleStep(
  route: "LOCAL" | "CLOUD",
  prompt: string,
  intent: Intent
): Promise<PlanExecutionResult> {
  const { result, resilience } = await executeWithResilience(route, intent, prompt, adapters);

  return {
    finalResult: result,
    stepResults: [result],
    fallbackUsed: resilience.fallbackUsed,
    totalLatencyMs: result.latencyMs,
  };
}

/**
 * Multi-step hybrid execution.
 * Passes outputs between steps sequentially.
 * Respects privacy: sensitive prompts get local preprocessing before cloud.
 */
async function executeHybridPlan(
  steps: ExecutionStep[],
  originalPrompt: string,
  intent: Intent
): Promise<PlanExecutionResult> {
  const stepResults: ProviderResult[] = [];
  const hybridSteps: HybridStepResult[] = [];
  let currentInput = originalPrompt;
  let anyFallbackUsed = false;
  let totalLatency = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const isLastStep = i === steps.length - 1;

    const shapedPrompt = STEP_PROMPTS[step.step]
      ? STEP_PROMPTS[step.step](currentInput)
      : currentInput;

    logger.info({
      stepIndex: i,
      stepType: step.step,
      provider: step.provider,
    }, `Executing hybrid step ${i + 1}/${steps.length}`);

    if (step.provider === "CLOUD" && intent.sensitive && i === 0) {
      logger.error("Privacy violation: cannot send sensitive prompt to cloud as first step");
      const failResult: ProviderResult = {
        provider: "CLOUD",
        output: "HAR blocked this request: sensitive data cannot be sent to cloud without local preprocessing.",
        latencyMs: 0,
        success: false,
        errorType: "BAD_REQUEST",
        errorMessage: "Privacy policy violation in hybrid plan",
      };
      stepResults.push(failResult);
      hybridSteps.push({ step: step.step, provider: step.provider, success: false, latencyMs: 0 });
      return {
        finalResult: failResult,
        stepResults,
        hybridSteps,
        fallbackUsed: false,
        totalLatencyMs: totalLatency,
      };
    }

    let resilientResult: ResilientExecutionResult;
    try {
      resilientResult = await executeWithResilience(step.provider, intent, shapedPrompt, adapters);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Step execution failed";
      logger.error({ stepIndex: i, error: message }, "Hybrid step failed catastrophically");

      const failResult: ProviderResult = {
        provider: step.provider,
        output: `Hybrid step ${step.step} failed: ${message}`,
        latencyMs: 0,
        success: false,
        errorType: "UNKNOWN",
        errorMessage: message,
      };
      stepResults.push(failResult);
      hybridSteps.push({ step: step.step, provider: step.provider, success: false, latencyMs: 0 });
      return {
        finalResult: failResult,
        stepResults,
        hybridSteps,
        fallbackUsed: anyFallbackUsed,
        totalLatencyMs: totalLatency,
      };
    }

    const { result, resilience } = resilientResult;
    stepResults.push(result);
    hybridSteps.push({
      step: step.step,
      provider: step.provider,
      success: result.success,
      latencyMs: result.latencyMs,
    });
    totalLatency += result.latencyMs;

    if (resilience.fallbackUsed) {
      anyFallbackUsed = true;
    }

    // Graceful Degradation Logic
    if (!result.success) {
      if (step.step === "PREPROCESS" && !intent.sensitive) {
        logger.warn("PREPROCESS failed, but intent is not sensitive. Degrading to direct CLOUD reason.");
        // We skip setting currentInput, effectively passing originalPrompt to the next step
        continue;
      }
      if (step.step === "POSTPROCESS" && i > 0) {
        logger.warn("POSTPROCESS failed, but previous step succeeded. Returning previous successful result.");
        // The last successful step was REASON, which is at i - 1
        const previousResult = stepResults[i - 1];
        return {
          finalResult: { ...previousResult, latencyMs: totalLatency },
          stepResults,
          hybridSteps,
          fallbackUsed: anyFallbackUsed,
          totalLatencyMs: totalLatency,
        };
      }

      logger.warn({ stepIndex: i, stepType: step.step }, "Hybrid step failed, stopping pipeline");
      return {
        finalResult: result,
        stepResults,
        hybridSteps,
        fallbackUsed: anyFallbackUsed,
        totalLatencyMs: totalLatency,
      };
    }

    if (!isLastStep) {
      currentInput = result.output;
    }

    logger.info({
      stepIndex: i,
      stepType: step.step,
      provider: result.provider,
      latencyMs: result.latencyMs,
      success: result.success,
    }, `Hybrid step ${i + 1} complete`);
  }

  const finalResult = stepResults[stepResults.length - 1];

  return {
    finalResult: {
      ...finalResult,
      latencyMs: totalLatency,
    },
    stepResults,
    hybridSteps,
    fallbackUsed: anyFallbackUsed,
    totalLatencyMs: totalLatency,
  };
}
