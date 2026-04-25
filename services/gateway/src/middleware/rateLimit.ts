import type { Request, Response, NextFunction } from "express";
import { env } from "@har/config";
import { createChildLogger } from "@har/logger";

const logger = createChildLogger("gateway:rate-limit");

interface RateLimitInfo {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitInfo>();

/**
 * Basic in-memory rate limiter middleware.
 * Uses X-API-KEY as identifier, or IP if missing.
 */
export const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  const key = (req.headers["x-api-key"] as string) || req.ip || "unknown";
  const now = Date.now();
  
  let info = store.get(key);

  // Initialize or reset if window passed
  if (!info || now > info.resetAt) {
    info = {
      count: 0,
      resetAt: now + env.RATE_LIMIT_WINDOW_MS,
    };
  }

  info.count++;
  store.set(key, info);

  if (info.count > env.RATE_LIMIT_MAX_REQUESTS) {
    logger.warn({ key, count: info.count }, "Rate limit exceeded");
    res.status(429).json({
      success: false,
      errorType: "RATE_LIMIT",
      message: "Rate limit exceeded. Try again later.",
    });
    return;
  }

  next();
};

// Cleanup store periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, info] of store.entries()) {
    if (now > info.resetAt) {
      store.delete(key);
    }
  }
}, 300000); // Every 5 minutes
