import { createChildLogger } from "@har/logger";
import type { ExecutionPlan, ExecutionStep, Intent, ProviderResult } from "@har/shared";
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
    `Clean up, restructure, and improve the clarity of the following text. Remove informal language, fix grammar, and make it well-structured. Only output the improved text, nothing else.\n\nInput:\n${input}`,
  REASON: (input) =>
    input, // Pass through — the preprocessed prompt IS the reasoning input
  POSTPROCESS: (input) =>
    `Simplify and reformat the following response to make it clearer and more concise. Keep the meaning intact but make it easier to understand.\n\nInput:\n${input}`,
};

export interface PlanExecutionResult {
  finalResult: ProviderResult;
  stepResults: ProviderResult[];
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
  let currentInput = originalPrompt;
  let anyFallbackUsed = false;
  let totalLatency = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const isLastStep = i === steps.length - 1;

    // Shape the prompt for this step type
    const shapedPrompt = STEP_PROMPTS[step.step]
      ? STEP_PROMPTS[step.step](currentInput)
      : currentInput;

    logger.info({
      stepIndex: i,
      stepType: step.step,
      provider: step.provider,
    }, `Executing hybrid step ${i + 1}/${steps.length}`);

    // Privacy guard: if this is a CLOUD step and the data is sensitive,
    // we MUST have preprocessed locally first (previous step output).
    // If this is the first step and it's CLOUD + sensitive, that's a planner error.
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
      return {
        finalResult: failResult,
        stepResults,
        fallbackUsed: false,
        totalLatencyMs: totalLatency,
      };
    }

    // Execute with resilience
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
      return {
        finalResult: failResult,
        stepResults,
        fallbackUsed: anyFallbackUsed,
        totalLatencyMs: totalLatency,
      };
    }

    const { result, resilience } = resilientResult;
    stepResults.push(result);
    totalLatency += result.latencyMs;

    if (resilience.fallbackUsed) {
      anyFallbackUsed = true;
    }

    // If this step failed even after resilience, stop the pipeline
    if (!result.success) {
      logger.warn({ stepIndex: i, stepType: step.step }, "Hybrid step failed after resilience, stopping pipeline");
      return {
        finalResult: result,
        stepResults,
        fallbackUsed: anyFallbackUsed,
        totalLatencyMs: totalLatency,
      };
    }

    // Pass output to next step (unless this is the last step)
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

  // The final step's result is the overall result
  const finalResult = stepResults[stepResults.length - 1];

  return {
    finalResult: {
      ...finalResult,
      latencyMs: totalLatency, // Total aggregated latency
    },
    stepResults,
    fallbackUsed: anyFallbackUsed,
    totalLatencyMs: totalLatency,
  };
}
