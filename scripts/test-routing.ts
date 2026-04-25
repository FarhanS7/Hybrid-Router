import { getFallbackIntent } from "../services/orchestrator/src/decision/fallbackIntent";
import { routePrompt } from "../services/orchestrator/src/decision/routePrompt";

const testCases = [
  // LOCAL
  { prompt: "hello", expected: "LOCAL" },
  { prompt: "rewrite this sentence professionally", expected: "LOCAL" },
  { prompt: "format this list", expected: "LOCAL" },
  { prompt: "summarize this short paragraph", expected: "LOCAL" },
  { prompt: "make this text cleaner", expected: "LOCAL" },

  // CLOUD
  { prompt: "design a scalable notification system", expected: "CLOUD" },
  { prompt: "Design an AI agent", expected: "CLOUD" },
  { prompt: "Design scalable caching system", expected: "CLOUD" },
  { prompt: "debug this distributed cache issue", expected: "CLOUD" },
  { prompt: "explain tradeoffs between PostgreSQL and MongoDB for a multi-tenant SaaS", expected: "CLOUD" },
  { prompt: "create a system architecture for a real-time chat app", expected: "CLOUD" },

  // HYBRID (Note: current heuristics might not trigger hybrid, depends on shouldUseHybrid)
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
  console.log("🧪 HAR Route Regression Tests\n");
  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    const intent = getFallbackIntent(tc.prompt);
    const { route, reason } = routePrompt(intent, tc.prompt);

    const success = route === tc.expected;
    if (success) {
      console.log(`✅ [PASS] "${tc.prompt.substring(0, 30)}..." -> ${route}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] "${tc.prompt.substring(0, 30)}..."`);
      console.error(`   Expected: ${tc.expected}, Got: ${route}`);
      console.error(`   Reason: ${reason}`);
      failed++;
    }
    
    if (tc.sensitive && route === "CLOUD") {
        console.error("🚨 SECURITY VIOLATION: Sensitive prompt routed to CLOUD!");
        process.exit(1);
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
