import { env } from "@har/config";
import { routePrompt } from "../services/orchestrator/src/decision/routePrompt.js";
import { classifyIntent } from "../services/intent-service/src/classifiers/ruleBasedClassifier.js";
import { initEmbeddingEngine } from "../services/intent-service/src/classifiers/embeddingEngine.js";
import { CODE_DOMAIN_EXAMPLES } from "../services/intent-service/src/classifiers/examplePrompts.js";

// Enforce code domain for this evaluation
(env as any).DOMAIN = "code";

const codeTestCases = [
  // Simple autocomplete / snippets -> LOCAL
  { prompt: "finish this function implementation", expected: "LOCAL" },
  { prompt: "complete this snippet", expected: "LOCAL" },
  { prompt: "what comes next in this array sorting function", expected: "LOCAL" },

  // Debugging & stacktraces -> CLOUD
  { prompt: "why is this throwing a TypeError: cannot read property of undefined?", expected: "CLOUD" },
  { prompt: "fix the bug in this async deadlock function", expected: "CLOUD" },
  { prompt: "debug this memory leak in my Node.js HTTP server", expected: "CLOUD" },
  { prompt: "this test fails with a race condition, how do I fix it?", expected: "CLOUD" },

  // Architecture & system design -> CLOUD
  { prompt: "architect a plugin system for this CLI application", expected: "CLOUD" },
  { prompt: "design a clean interface for this database layer", expected: "CLOUD" },

  // Complex refactoring -> CLOUD
  { prompt: "this function is 200 lines long, help me refactor it cleanly", expected: "CLOUD" },
  { prompt: "how should I restructure this monorepo module?", expected: "CLOUD" },

  // Sensitive code -> LOCAL
  { prompt: "refactor this code that has my API key sk-test-999999999999999999999999", expected: "LOCAL", sensitive: true },
  { prompt: "fix this DB connector: postgres://user:secretpassword123@localhost:5432/db", expected: "LOCAL", sensitive: true },
];

async function runCodeEval() {
  console.log("🧪 HAR Code Domain Benchmark Evaluation (DOMAIN=code)\n");

  console.log("Loading code domain embedding engine...");
  await initEmbeddingEngine(CODE_DOMAIN_EXAMPLES);
  console.log("Code domain embedding engine ready.\n");

  let passed = 0;
  let failed = 0;

  for (const tc of codeTestCases) {
    const intent = await classifyIntent(tc.prompt);
    const { route, reason } = routePrompt(intent, tc.prompt);

    const success = route === tc.expected;
    if (success) {
      console.log(`✅ [PASS] "${tc.prompt.substring(0, 40)}..." -> ${route} (${intent.classifierMethod}, conf: ${intent.confidence})`);
      passed++;
    } else {
      console.error(`❌ [FAIL] "${tc.prompt.substring(0, 40)}..."`);
      console.error(`   Expected: ${tc.expected}, Got: ${route}`);
      console.error(`   Reason: ${reason}`);
      failed++;
    }

    if (tc.sensitive && route === "CLOUD") {
      console.error("🚨 SECURITY VIOLATION: Sensitive code prompt routed to CLOUD!");
      process.exit(1);
    }
  }

  console.log(`\nCode Domain Eval Results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runCodeEval().catch((err) => {
  console.error(err);
  process.exit(1);
});
