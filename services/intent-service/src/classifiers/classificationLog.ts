import fs from "fs";
import path from "path";
import crypto from "crypto";

const LOG_DIR = "./logs";
const LOG_FILE = path.join(LOG_DIR, "classifications.jsonl");

export interface ClassificationLogEntry {
  timestamp: string;
  promptHash: string; // SHA-256 hash — privacy first, never log raw prompt
  promptLength: number;
  taskType: string;
  confidence: number;
  classifierMethod: string;
  sensitive: boolean;
}

/**
 * Appends a classification record to logs/classifications.jsonl asynchronously.
 */
export async function logClassification(
  prompt: string,
  taskType: string,
  confidence: number,
  classifierMethod: string,
  sensitive: boolean
): Promise<void> {
  try {
    const promptHash = crypto
      .createHash("sha256")
      .update(prompt)
      .digest("hex");

    const entry: ClassificationLogEntry = {
      timestamp: new Date().toISOString(),
      promptHash,
      promptLength: prompt.length,
      taskType,
      confidence,
      classifierMethod,
      sensitive,
    };

    await fs.promises.mkdir(LOG_DIR, { recursive: true });
    await fs.promises.appendFile(LOG_FILE, JSON.stringify(entry) + "\n", "utf-8");
  } catch (err) {
    // Non-blocking log failure
    console.error("Failed to write classification log:", err);
  }
}
