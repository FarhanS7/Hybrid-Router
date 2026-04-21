import express from "express";
import { env } from "@har/config";
import { createChildLogger } from "@har/logger";
import { processPrompt } from "./services/processPrompt.js";

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
    const result = await processPrompt(prompt);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: message }, "Orchestration failed");
    res.status(500).json({ error: "Processing failed", message });
  }
});

app.listen(port, () => {
  logger.info(`Orchestrator service listening on port ${port}`);
});
