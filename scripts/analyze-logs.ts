import fs from "fs";
import path from "path";

interface LogEntry {
  timestamp: string;
  promptHash: string;
  promptLength: number;
  taskType: string;
  confidence: number;
  classifierMethod: string;
  sensitive: boolean;
}

function analyzeLogs() {
  const logFile = path.resolve(process.cwd(), "logs/classifications.jsonl");

  if (!fs.existsSync(logFile)) {
    console.log("ℹ️ No classification logs found at logs/classifications.jsonl yet.");
    console.log("   Run requests through HAR to generate real-world classification analytics.");
    return;
  }

  const fileContent = fs.readFileSync(logFile, "utf-8");
  const lines = fileContent.split("\n").filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    console.log("ℹ️ Classification log file is empty.");
    return;
  }

  const entries: LogEntry[] = lines.map((line) => JSON.parse(line));

  console.log(`📊 HAR Classification Analytics (${entries.length} logged requests)\n`);

  // Confidence distribution by task type
  const byTask: Record<string, number[]> = {};
  let keywordFallbackCount = 0;

  for (const entry of entries) {
    if (!byTask[entry.taskType]) byTask[entry.taskType] = [];
    byTask[entry.taskType].push(entry.confidence);

    if (entry.classifierMethod === "keyword-fallback") {
      keywordFallbackCount++;
    }
  }

  console.log("Task Type Breakdown & Confidence:");
  console.log("──────────────────────────────────────────────────");
  for (const [task, scores] of Object.entries(byTask)) {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const lowConf = scores.filter((s) => s < 0.55).length;
    console.log(
      `  ${task.padEnd(16)} | count: ${String(scores.length).padStart(3)} | avg conf: ${mean.toFixed(2)} | low-conf (<0.55): ${lowConf}`
    );
  }

  console.log("──────────────────────────────────────────────────");
  const fallbackPct = ((keywordFallbackCount / entries.length) * 100).toFixed(1);
  console.log(`Keyword Fallback Rate: ${keywordFallbackCount}/${entries.length} (${fallbackPct}%)\n`);
}

analyzeLogs();
