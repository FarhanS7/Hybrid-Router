import { executeWithResilience } from "../services/orchestrator/src/resilience/executeWithResilience.js";
import type { Intent, ProviderResult } from "@har/shared";

async function runResilienceTest() {
  console.log("🧪 HAR Resilience Adversarial Test\n");

  const cloudCallCount = { n: 0 };
  const adapters = {
    LOCAL: async (): Promise<ProviderResult> => {
      throw new Error("The operation was aborted due to timeout");
    },
    CLOUD: async (): Promise<ProviderResult> => {
      cloudCallCount.n++;
      return { provider: "CLOUD", output: "ok", latencyMs: 1, success: true };
    },
  };

  const sensitiveIntent: Intent = {
    sensitive: true,
    taskType: "other",
    complexity: "simple",
    confidence: 0.9,
  };

  await executeWithResilience("LOCAL", sensitiveIntent, "my password is hunter2", adapters);

  if (cloudCallCount.n > 0) {
    console.error("🚨 SECURITY VIOLATION: Cloud was called for a sensitive prompt after local timeout");
    process.exit(1);
  }
  console.log("✅ Sensitive prompt did not fall back to cloud after local timeout");
}

runResilienceTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
