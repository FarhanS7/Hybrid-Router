import express from "express";
import { env, validateEnv } from "@har/config";
import { createChildLogger } from "@har/logger";
import { runWorkflow } from "./services/runWorkflow.js";

const logger = createChildLogger("orchestrator");
const app = express();
const port = env.ORCHESTRATOR_PORT;

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "orchestrator" });
});

// Orchestrate prompt processing
app.post("/orchestrate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing or invalid 'prompt' field" });
    return;
  }

  try {
    const result = await runWorkflow(prompt);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: message }, "Orchestration failed");
    res.status(500).json({ error: "Processing failed", message });
  }
});

app.listen(port, "127.0.0.1", async () => {
  logger.info(`Orchestrator service listening on 127.0.0.1:${port}`);

  // Perform startup validation
  const validation = await validateEnv();
  const hasError = validation.some(v => v.status === "error");
  
  validation.forEach(v => {
    const logMethod = v.status === "error" ? "error" : v.status === "warn" ? "warn" : "info";
    logger[logMethod]({ service: v.service, tip: v.tip }, v.message);
  });

  if (hasError) {
    logger.error("Orchestrator started with CRITICAL errors. Some routes will fail.");
  } else {
    const mode = env.CLOUD_API_KEY ? "HYBRID (Local + Cloud)" : "LOCAL-only";
    logger.info(`HAR is ready in ${mode} mode.`);
  }
});
