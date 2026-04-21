import express from "express";
import { env } from "@har/config";
import { createChildLogger } from "@har/logger";
import { classifyIntent } from "./classifiers/ruleBasedClassifier.js";

const logger = createChildLogger("intent-service");
const app = express();
const port = env.INTENT_SERVICE_PORT;

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "intent-service" });
});

// Classify intent from prompt
app.post("/classify", (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing or invalid 'prompt' field" });
    return;
  }

  const intent = classifyIntent(prompt);
  logger.info({ prompt, intent }, "Intent classified");

  res.json(intent);
});

app.listen(port, () => {
  logger.info(`Intent service listening on port ${port}`);
});
