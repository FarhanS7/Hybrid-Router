import { getFallbackIntent } from "../services/orchestrator/src/decision/fallbackIntent.js";
import { routePrompt } from "../services/orchestrator/src/decision/routePrompt.js";
import { classifyIntent } from "../services/intent-service/src/classifiers/ruleBasedClassifier.js";
import { initEmbeddingEngine } from "../services/intent-service/src/classifiers/embeddingEngine.js";
import { TASK_EXAMPLES } from "../services/intent-service/src/classifiers/examplePrompts.js";

const testCases = [
  // LOCAL
  { prompt: "hello", expected: "LOCAL" },
  { prompt: "rewrite this sentence professionally", expected: "LOCAL" },
  { prompt: "format this list", expected: "LOCAL" },
  { prompt: "summarize this short paragraph", expected: "LOCAL" },
  { prompt: "make this text cleaner", expected: "LOCAL" },

  // CLOUD (including paraphrased prompts that keyword matching previously missed)
  { prompt: "design a scalable notification system", expected: "CLOUD" },
  { prompt: "Design an AI agent", expected: "CLOUD" },
  { prompt: "Design scalable caching system", expected: "CLOUD" },
  { prompt: "debug this distributed cache issue", expected: "CLOUD" },
  { prompt: "explain tradeoffs between PostgreSQL and MongoDB for a multi-tenant SaaS", expected: "CLOUD" },
  { prompt: "create a system architecture for a real-time chat app", expected: "CLOUD" },
  { prompt: "how should I structure my backend services?", expected: "CLOUD" },
  { prompt: "plan the infrastructure for a high throughput payment pipeline", expected: "CLOUD" },

  // HYBRID
  { prompt: "clean this messy architecture note and explain the design", expected: "HYBRID" },
  { prompt: "analyze this messy debugging log and propose a fix", expected: "HYBRID" },
  { prompt: "redact sensitive details from this note and then explain the architecture", expected: "HYBRID" },

  // Sensitive LOCAL
  { prompt: "my api key is sk-test-123", expected: "LOCAL", sensitive: true },
  { prompt: "my password is hunter2", expected: "LOCAL", sensitive: true },
  { prompt: "my email is test@example.com", expected: "LOCAL", sensitive: true },
  { prompt: "my phone number is +8801712345678", expected: "LOCAL", sensitive: true },
  { prompt: "my credit card is 4111 1111 1111 1111", expected: "LOCAL", sensitive: true },
];

async function runTests() {
  console.log("🧪 HAR V3 Route Regression Tests (Real Embedding Classifier)\n");

  console.log("Loading embedding engine...");
  await initEmbeddingEngine(TASK_EXAMPLES);
  console.log("Embedding engine ready.\n");

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    const realIntent = await classifyIntent(tc.prompt);
    const fallbackIntent = getFallbackIntent(tc.prompt);

    const { route, reason } = routePrompt(realIntent, tc.prompt);
    const fallbackResult = routePrompt(fallbackIntent, tc.prompt);

    if (route !== fallbackResult.route) {
      console.warn(`⚠️ Divergence on: "${tc.prompt.substring(0, 35)}..."`);
      console.warn(`   Real (${realIntent.classifierMethod}, conf: ${realIntent.confidence}): ${route} | Fallback: ${fallbackResult.route}`);
    }

    const success = route === tc.expected;
    if (success) {
      console.log(`✅ [PASS] "${tc.prompt.substring(0, 35)}..." -> ${route} (${realIntent.classifierMethod}, conf: ${realIntent.confidence})`);
      passed++;
    } else {
      console.error(`❌ [FAIL] "${tc.prompt.substring(0, 35)}..."`);
      console.error(`   Expected: ${tc.expected}, Got: ${route}`);
      console.error(`   Reason: ${reason}`);
      failed++;
    }

    if (tc.sensitive && (route === "CLOUD" || fallbackResult.route === "CLOUD")) {
      console.error("🚨 SECURITY VIOLATION: Sensitive prompt routed to CLOUD!");
      process.exit(1);
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
