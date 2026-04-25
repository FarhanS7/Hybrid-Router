import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

// Load .env from monorepo root (two levels up from any service/package)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_API_KEY: z.string().default("har_dev_key"),

  // PORTS
  GATEWAY_PORT: z.coerce.number().default(4000),
  ORCHESTRATOR_PORT: z.coerce.number().default(4001),
  INTENT_SERVICE_PORT: z.coerce.number().default(4002),
  LOCAL_LLM_PORT: z.coerce.number().default(4003),
  CLOUD_LLM_PORT: z.coerce.number().default(4004),
  WEB_PORT: z.coerce.number().default(3000),

  // LOCAL LLM
  OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("llama3.2"),

  // CLOUD LLM
  CLOUD_API_KEY: z.string().optional(),
  CLOUD_MODEL: z.string().default("gemini-2.0-flash"),
  CLOUD_PROVIDER: z.enum(["gemini", "openai"]).default("gemini"),

  // POLICIES
  MAX_PROMPT_CHARS: z.coerce.number().int().positive().default(12000),
  LOCAL_TIMEOUT_MS: z.coerce.number().default(15000),
  CLOUD_TIMEOUT_MS: z.coerce.number().default(12000),
  MAX_RETRIES: z.coerce.number().default(1),
  ALLOW_CLOUD_FALLBACK: z.string().transform((v) => v === "true").default("true"),

  // PRIVACY (Phase 7)
  PRIVACY_MODE: z.enum(["strict", "balanced"]).default("strict"),

  // RATE LIMITING (Phase 7)
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(60),
});

export type Env = z.infer<typeof envSchema>;
export const env: Env = envSchema.parse(process.env);
