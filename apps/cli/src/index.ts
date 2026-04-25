#!/usr/bin/env node
import { Command } from "commander";
import type { HarResponse } from "@har/shared";
import { env } from "@har/config";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:4000";

const program = new Command();

program
  .name("har")
  .description("Hybrid AI Router CLI — route prompts intelligently between local and cloud LLMs")
  .version("1.0.0");

// --- ANSI Colors ---
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
};

let useColor = true;

const log = (color: keyof typeof colors, text: string) => {
  const output = useColor ? `${colors[color]}${text}${colors.reset}` : text;
  console.log(output);
};

const stripColors = (text: string) => text.replace(/\x1b\[[0-9;]*m/g, "");

program
  .command("doctor")
  .description("Check environment health and configuration status")
  .action(async () => {
    console.log(`\n🏥 ${colors.bold}HAR Doctor — System Check${colors.reset}`);
    console.log(`   ${colors.gray}Validating environment and service connectivity...${colors.reset}\n`);

    const { validateEnv } = await import("@har/config");
    const results = await validateEnv();

    let hasError = false;
    results.forEach((r: any) => {
      const icon = r.status === "ok" ? "✅" : r.status === "warn" ? "⚠️" : "❌";
      const statusColor = r.status === "ok" ? colors.green : r.status === "warn" ? colors.yellow : colors.red;
      
      console.log(`${icon} ${statusColor}${r.service}:${colors.reset} ${r.message}`);
      if (r.tip) console.log(`   ${colors.gray}Tip: ${r.tip}${colors.reset}`);
      if (r.status === "error") hasError = true;
    });

    console.log();
    if (hasError) {
      console.log(`${colors.red}${colors.bold}System is not healthy.${colors.reset} Follow the tips above.`);
    } else {
      console.log(`${colors.green}${colors.bold}System is healthy!${colors.reset} You are ready to route.`);
    }
    console.log();
  });

program
  .argument("<prompt>", "The prompt to process")
  .option("-v, --verbose", "Show execution trace (intent, routing reason, resilience)")
  .option("-j, --json", "Output as structured JSON")
  .option("--no-color", "Disable colored output")
  .action(async (prompt: string, options: { verbose?: boolean; json?: boolean; color: boolean }) => {
    useColor = options.color !== false;

    if (!options.json) {
      log("cyan", "\n🚀 HAR — Hybrid AI Router");
      log("gray", "─".repeat(40));
    }

    try {
      const response = await fetch(`${GATEWAY_URL}/process`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": env.APP_API_KEY
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string; message?: string; errorType?: string };
        
        if (options.json) {
          console.log(JSON.stringify({ success: false, ...errorData }, null, 2));
        } else {
          log("red", `❌ Error: ${errorData.error || "Unknown error"}`);
          handleFriendlyError(errorData.errorType, errorData.message);
        }
        process.exit(1);
      }

      const result = (await response.json()) as HarResponse;

      if (options.json) {
        // Return stable public subset
        const publicOutput = {
          prompt: result.prompt,
          normalizedPrompt: result.normalizedPrompt,
          route: result.route,
          finalProvider: result.finalProvider,
          intent: result.intent,
          latencyMs: result.latencyMs,
          fallbackUsed: result.fallbackUsed,
          fallbackReason: result.fallbackReason,
          model: result.model,
          result: result.result,
          execution: result.execution,
        };
        console.log(JSON.stringify(publicOutput, null, 2));
        return;
      }

      // --- Verbose Execution Trace ---
      if (options.verbose) {
        log("bold", "🔍 Execution Trace:");
        console.log(`   ${colors.gray}Intent:${colors.reset}       ${result.intent.taskType} (Complexity: ${result.intent.complexity}, Confidence: ${result.intent.confidence})`);
        console.log(`   ${colors.gray}Initial Route:${colors.reset} ${result.route}`);
        console.log(`   ${colors.gray}Final Provider:${colors.reset} ${result.finalProvider}`);
        console.log(`   ${colors.gray}Reason:${colors.reset}       ${result.routeReason || getRouteReason(result)}`);
        if (result.fallbackUsed) {
          log("yellow", `   ⚠️ Fallback used due to ${result.fallbackReason || result.errorType || "provider failure"}`);
        }
        if (result.execution?.steps) {
          log("bold", "   🪜 Hybrid Steps:");
          result.execution.steps.forEach((s, i) => {
            console.log(`     ${i + 1}. ${s.step} [${s.provider}] - ${s.success ? "✅" : "❌"} (${s.latencyMs}ms)`);
          });
        }
        console.log();
      }

      // --- Standard Output ---
      console.log(`${colors.bold}Initial Route:  ${result.route}${colors.reset}`);
      console.log(`${colors.gray}Final Provider: ${result.finalProvider}${colors.reset}`);
      if (result.model) console.log(`${colors.gray}Model:          ${result.model}${colors.reset}`);
      console.log(`${colors.gray}Latency:        ${(result.latencyMs / 1000).toFixed(1)}s${colors.reset}`);
      console.log(`${colors.gray}Fallback:       ${result.fallbackUsed ? "yes" : "no"}${colors.reset}`);
      if (result.fallbackUsed && result.fallbackReason) {
        console.log(`${colors.yellow}Fallback Reason: ${result.fallbackReason}${colors.reset}`);
      }
      console.log();

      log("gray", "─".repeat(40));
      log("bold", "📤 Result:\n");
      console.log(result.result);
      console.log();

    } catch (error) {
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: "Gateway connection failed" }, null, 2));
      } else {
        log("red", "❌ Failed to connect to HAR Gateway");
        console.log(`   ${colors.gray}Make sure the services are running: npm run dev${colors.reset}`);
        console.log(`   ${colors.gray}Tip: Check if gateway port 4000 is occupied.${colors.reset}`);
      }
      process.exit(1);
    }
  });

// --- Helper Functions ---

function getRouteReason(res: HarResponse): string {
  if (res.route === "HYBRID") return "Complex/messy prompt requiring local cleanup + cloud reasoning";
  if (res.intent.sensitive) return "Sensitive data restricted to local execution";
  if (res.intent.complexity === "complex") return "High complexity requires cloud reasoning";
  return "Simple task routed to local provider for speed/cost";
}

function handleFriendlyError(errorType?: string, message?: string) {
  if (errorType === "PROMPT_TOO_LARGE") {
    log("red", "❌ Prompt too large");
    console.log(`   ${message}`);
    console.log(`   ${colors.gray}Tip: Split large documents into smaller chunks.${colors.reset}`);
    return;
  }
  
  if (errorType === "LOCAL_UNAVAILABLE" || message?.includes("fetch failed")) {
    console.log(`\n👉 ${colors.bold}Fix: Run \`ollama serve\` and ensure your local model is loaded.${colors.reset}`);
  } else if (message?.includes("CLOUD_API_KEY")) {
    console.log(`\n👉 ${colors.bold}Fix: Add CLOUD_API_KEY in your .env file to enable cloud routing.${colors.reset}`);
  } else if (message?.includes("model") && message?.includes("not found")) {
    console.log(`\n👉 ${colors.bold}Tip: Try running \`ollama run <model_name>\` to download the model.${colors.reset}`);
  }
}

program.parse();
