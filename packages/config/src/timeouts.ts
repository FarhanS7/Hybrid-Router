import { env } from "./env.js";

export const TIMEOUTS = {
  LOCAL: env.LOCAL_TIMEOUT_MS,
  CLOUD: env.CLOUD_TIMEOUT_MS,
};

export const RETRY_CONFIG = {
  MAX_RETRIES: env.MAX_RETRIES,
};
