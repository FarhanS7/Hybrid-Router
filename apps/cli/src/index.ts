#!/usr/bin/env node
import { Command } from "commander";
import type { HarResponse } from "@har/shared";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:4000";

const program = new Command();

program
  .name("har")
  .description("Hybrid AI Router CLI — route prompts intelligently between local and cloud LLMs")
  .version("1.0.0");

program
  .argument("<prompt>", "The prompt to process")
  .option("-r, --route <type>", "Force a specific route (LOCAL, CLOUD)")
  .action(async (prompt: string) => {
    console.log("\n🚀 HAR — Hybrid AI Router");
    console.log("─".repeat(40));
    console.log(`📝 Prompt: "${prompt}"\n`);
    console.log("⏳ Processing...\n");

    try {
      const response = await fetch(`${GATEWAY_URL}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string; message?: string };
        console.error(`❌ Error: ${errorData.error || "Unknown error"}`);
        if (errorData.message) console.error(`   ${errorData.message}`);
        process.exit(1);
      }

      const result = (await response.json()) as HarResponse;

      // Display intent
      console.log("🧠 Intent:");
      console.log(`   Complexity:  ${result.intent.complexity}`);
      console.log(`   Task Type:   ${result.intent.taskType}`);
      console.log(`   Sensitive:   ${result.intent.sensitive}`);
      console.log(`   Confidence:  ${result.intent.confidence}`);
      console.log();

      // Display routing
      console.log(`🔀 Route:    ${result.route}`);
      if (result.model) console.log(`🤖 Model:    ${result.model}`);
      console.log(`⏱️  Latency:  ${result.latencyMs}ms`);
      console.log(`✅ Success:  ${result.success}`);
      console.log();

      // Display result
      console.log("─".repeat(40));
      console.log("📤 Result:\n");
      console.log(result.result);
      console.log();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`❌ Failed to connect to gateway: ${message}`);
      console.error("   Make sure all services are running: npm run dev");
      process.exit(1);
    }
  });

program.parse();
