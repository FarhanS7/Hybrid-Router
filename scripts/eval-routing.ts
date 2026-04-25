import { getFallbackIntent } from "../services/orchestrator/src/decision/fallbackIntent";
import { routePrompt } from "../services/orchestrator/src/decision/routePrompt";

type EvalCase = {
  prompt: string;
  expectedRoute: "LOCAL" | "CLOUD" | "HYBRID";
  sensitive?: boolean;
};

const dataset: EvalCase[] = [
  { prompt: "hi there", expectedRoute: "LOCAL" },
  { prompt: "how are you today?", expectedRoute: "LOCAL" },
  { prompt: "summarize: 'The quick brown fox jumps over the lazy dog'", expectedRoute: "LOCAL" },
  { prompt: "rewrite this email to be polite: 'Hey, do this now.'", expectedRoute: "LOCAL" },
  { prompt: "format this list: item1, item2, item3", expectedRoute: "LOCAL" },
  
  { prompt: "Design a scalable notification system using Redis and WebSockets", expectedRoute: "CLOUD" },
  { prompt: "Explain the tradeoffs between SQL and NoSQL for a high-traffic app", expectedRoute: "CLOUD" },
  { prompt: "Design a distributed locking mechanism using Zookeeper", expectedRoute: "CLOUD" },
  { prompt: "Debug this OOM error in a Java Spring Boot application", expectedRoute: "CLOUD" },
  { prompt: "Architect a multi-region deployment strategy for AWS", expectedRoute: "CLOUD" },
  
  { prompt: "Clean this messy architecture note and explain the design", expectedRoute: "HYBRID" },
  { prompt: "Analyze this messy log file and propose a fix", expectedRoute: "HYBRID" },
  { prompt: "Redact PII from this note and then analyze the logic", expectedRoute: "HYBRID" },
  { prompt: "Clean and rewrite this rough draft", expectedRoute: "HYBRID" },
  
  { prompt: "my api key is sk-1234567890", expectedRoute: "LOCAL", sensitive: true },
  { prompt: "the password is 'admin123'", expectedRoute: "LOCAL", sensitive: true },
  { prompt: "my ssn is 000-00-0000", expectedRoute: "LOCAL", sensitive: true },
  { prompt: "here is my private key: -----BEGIN RSA PRIVATE KEY-----", expectedRoute: "LOCAL", sensitive: true },
  { prompt: "my phone is 555-0199", expectedRoute: "LOCAL", sensitive: true },
];

function runEval() {
  console.log("📊 HAR Routing Evaluation\n");
  
  let total = dataset.length;
  let correct = 0;
  let sensitivePassed = 0;
  let sensitiveTotal = 0;
  
  const distribution: Record<string, number> = { LOCAL: 0, CLOUD: 0, HYBRID: 0 };

  for (const tc of dataset) {
    const intent = getFallbackIntent(tc.prompt);
    const { route } = routePrompt(intent, tc.prompt);
    
    distribution[route]++;
    
    if (route === tc.expectedRoute) {
      correct++;
    }
    
    if (tc.sensitive) {
      sensitiveTotal++;
      if (route !== "CLOUD") {
        sensitivePassed++;
      }
    }
  }

  const accuracy = (correct / total) * 100;
  const safetyRate = sensitiveTotal > 0 ? (sensitivePassed / sensitiveTotal) * 100 : 100;

  console.log(`Cases:            ${total}`);
  console.log(`Route Accuracy:   ${accuracy.toFixed(1)}%`);
  console.log(`Sensitive Safety: ${safetyRate.toFixed(1)}%`);
  console.log(`LOCAL: ${distribution.LOCAL} | CLOUD: ${distribution.CLOUD} | HYBRID: ${distribution.HYBRID}`);
  
  console.log("\n(Note: This eval used deterministic heuristics. Real performance may vary with LLM-based intent service.)");
}

runEval();
