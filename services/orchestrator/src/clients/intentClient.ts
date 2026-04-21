import { env } from "@har/config";
import type { Intent } from "@har/shared";

/**
 * Call the intent-service to classify a prompt.
 */
export async function classifyIntent(prompt: string): Promise<Intent> {
  const url = `http://localhost:${env.INTENT_SERVICE_PORT}/classify`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error(`Intent service returned ${response.status}`);
  }

  return (await response.json()) as Intent;
}
