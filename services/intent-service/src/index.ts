import express from "express";
import { env } from "@har/config";
import { createChildLogger } from "@har/logger";
import { classifyIntent } from "./classifiers/ruleBasedClassifier.js";
import {
  initEmbeddingEngine,
  isEmbeddingEngineReady,
} from "./classifiers/embeddingEngine.js";
import { TASK_EXAMPLES, CODE_DOMAIN_EXAMPLES } from "./classifiers/examplePrompts.js";
import { logClassification } from "./classifiers/classificationLog.js";

const logger = createChildLogger("intent-service");
const app = express();
const port = env.INTENT_SERVICE_PORT;

app.use(express.json());

// Health check with readiness gate
app.get("/health", (_req, res) => {
  if (!isEmbeddingEngineReady()) {
    res.status(503).json({
      status: "starting",
      service: "intent-service",
      detail: "Loading embedding model into memory",
    });
    return;
  }
  res.json({ status: "ok", service: "intent-service" });
});

// Classify intent from prompt (Async)
app.post("/classify", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing or invalid 'prompt' field" });
    return;
  }

  try {
    const intent = await classifyIntent(prompt);
    logger.info({ intent }, "Intent classified");

    // Async classification logging for accuracy analytics
    logClassification(
      prompt,
      intent.taskType,
      intent.confidence,
      intent.classifierMethod || "keyword-fallback",
      intent.sensitive
    ).catch(() => {});

    res.json(intent);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Classification failed";
    logger.error({ error: message }, "Classification error");
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  const domain = env.DOMAIN;
  const examples = domain === "code" ? CODE_DOMAIN_EXAMPLES : TASK_EXAMPLES;

  logger.info({ domain }, `Initializing embedding engine for domain: ${domain}...`);
  try {
    await initEmbeddingEngine(examples);
    logger.info("Embedding engine initialized successfully");
  } catch (err) {
    logger.warn({ error: String(err) }, "Failed to initialize embedding engine, fallback to keyword classifier");
  }

  app.listen(port, "127.0.0.1", () => {
    logger.info(`Intent service listening on 127.0.0.1:${port}`);
  });
}

startServer();
