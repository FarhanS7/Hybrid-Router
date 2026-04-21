import express from "express";
import { env } from "@har/config";
import { createChildLogger } from "@har/logger";
import { generateWithOllama } from "./providers/ollamaProvider.js";

const logger = createChildLogger("local-llm");
const app = express();
const port = env.LOCAL_LLM_PORT;

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "local-llm", model: env.OLLAMA_MODEL, ollamaUrl: env.OLLAMA_BASE_URL });
});

// Generate with local LLM
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing or invalid 'prompt' field" });
    return;
  }

  logger.info({ prompt: prompt.substring(0, 100) }, "Local generation request");
  const result = await generateWithOllama(prompt);
  res.json(result);
});

app.listen(port, () => {
  logger.info(`Local LLM service listening on port ${port}`);
});
