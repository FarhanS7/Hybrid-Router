import { env } from "@har/config";
import { createChildLogger } from "@har/logger";
import express from "express";
import { generateWithCloud } from "./providers/cloudProvider.js";

const logger = createChildLogger("cloud-llm");
const app = express();
const port = env.CLOUD_LLM_PORT;

app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "cloud-llm",
    model: env.CLOUD_MODEL,
    provider: env.CLOUD_PROVIDER,
    apiKeyConfigured: !!env.CLOUD_API_KEY,
  });
});

// Generate with cloud LLM
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing or invalid 'prompt' field" });
    return;
  }

  logger.info({ prompt: prompt.substring(0, 100) }, "Cloud generation request");
  const result = await generateWithCloud(prompt);
  res.json(result);
});

app.listen(port, () => {
  logger.info(`Cloud LLM service listening on port ${port}`);
});
