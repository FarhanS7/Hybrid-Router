import type { HarResponse } from "@har/shared";

export interface HarClientOptions {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
}

export class HarClient {
  private baseUrl: string;
  private apiKey: string;
  private timeoutMs: number;

  constructor(options: HarClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 30000;
  }

  /**
   * Processes a prompt through the HAR gateway.
   */
  async process(prompt: string): Promise<HarResponse> {
    if (!prompt || typeof prompt !== "string") {
      throw new Error("Prompt must be a non-empty string");
    }

    const response = await fetch(`${this.baseUrl}/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({ prompt }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HAR error ${response.status}: ${errorText}`);
    }

    return (await response.json()) as HarResponse;
  }

  /**
   * Submits an asynchronous processing task with a webhook callback URL.
   */
  async processAsync(prompt: string, callbackUrl: string): Promise<{ jobId: string; status: string }> {
    const response = await fetch(`${this.baseUrl}/process/async`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify({ prompt, callbackUrl }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HAR error ${response.status}: ${errorText}`);
    }

    return (await response.json()) as { jobId: string; status: string };
  }

  /**
   * Streams response output chunks (scaffolded for SSE extension).
   */
  async *stream(prompt: string): AsyncGenerator<string, void, unknown> {
    const response = await this.process(prompt);
    yield response.result;
  }
}
