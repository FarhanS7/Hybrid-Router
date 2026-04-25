import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "@har/config";
import { createChildLogger } from "@har/logger";
import { rateLimit } from "./middleware/rateLimit.js";
import type { HarResponse } from "@har/shared";

const logger = createChildLogger("gateway");
const app = express();
const port = env.GATEWAY_PORT;

app.use(helmet());
app.use(cors({
  origin: env.NODE_ENV === "production" ? ["https://yourdomain.com"] : "*",
  methods: ["GET", "POST"],
}));
app.use(express.json());
app.use(rateLimit);

// Authentication Middleware
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers["x-api-key"];
  
  if (!apiKey || apiKey !== env.APP_API_KEY) {
    logger.warn({ ip: req.ip }, "Unauthorized access attempt");
    res.status(401).json({ error: "Unauthorized: Missing or invalid API key" });
    return;
  }
  next();
};

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
app.post("/process", authMiddleware, async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({ error: "Missing or invalid 'prompt' field" });
    return;
  }

  if (prompt.trim().length === 0) {
    res.status(400).json({ error: "Prompt must not be empty" });
    return;
  }

  if (prompt.length > env.MAX_PROMPT_CHARS) {
    res.status(400).json({
      success: false,
      errorType: "PROMPT_TOO_LARGE",
      message: `Prompt is too large. Maximum allowed length is ${env.MAX_PROMPT_CHARS} characters.`,
    });
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

app.listen(port, "127.0.0.1", () => {
  logger.info(`Gateway service listening on 127.0.0.1:${port}`);
});
