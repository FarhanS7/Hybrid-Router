import { env } from "@har/config";
import type { ProviderResult } from "@har/shared";

/**
 * Call the local-llm service to generate a completion.
 */
export async function generateLocal(prompt: string): Promise<ProviderResult> {
  const url = `http://localhost:${env.LOCAL_LLM_PORT}/generate`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (!response.ok) {
    throw new Error(`Local LLM service returned ${response.status}`);
  }

  return (await response.json()) as ProviderResult;
}
