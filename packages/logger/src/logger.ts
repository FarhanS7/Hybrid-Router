import { pino } from "pino";

const isDevelopment = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: ["apiKey", "CLOUD_API_KEY", "key", "token", "auth", "authorization", "password"],
    censor: "[REDACTED]",
  },
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "SYS:standard",
        },
      }
    : undefined,
});

export const createChildLogger = (serviceName: string) => {
  return logger.child({ service: serviceName });
};
