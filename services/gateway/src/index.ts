import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "@har/config";
import { createChildLogger } from "@har/logger";
import type { HarResponse } from "@har/shared";

const logger = createChildLogger("gateway");
const app = express();
const port = env.GATEWAY_PORT;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, "Incoming request");
  next();
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "gateway" });
});

// Process prompt — thin proxy to orchestrator
app.post("/process", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing or invalid 'prompt' field" });
    return;
  }

  if (prompt.trim().length === 0) {
    res.status(400).json({ error: "Prompt must not be empty" });
    return;
  }

  try {
    const orchestratorUrl = `http://localhost:${env.ORCHESTRATOR_PORT}/orchestrate`;

    const response = await fetch(orchestratorUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      res.status(response.status).json(errorData);
      return;
    }

    const result = (await response.json()) as HarResponse;
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ error: message }, "Gateway processing failed");
    res.status(502).json({ error: "Service unavailable", message });
  }
});

app.listen(port, () => {
  logger.info(`Gateway service listening on port ${port}`);
});
