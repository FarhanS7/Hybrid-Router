import { env } from "./env.js";

export const ROUTING_POLICIES = {
  ALLOW_CLOUD_FALLBACK: env.ALLOW_CLOUD_FALLBACK,
  DEFAULT_ROUTE: "LOCAL" as const,
};
