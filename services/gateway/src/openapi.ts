export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Hybrid AI Router (HAR) Gateway API",
    version: "1.0.0",
    description: "Intelligent routing control layer between local models (Ollama) and cloud LLMs.",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local Gateway Server",
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
        description: "API Key required for request authentication",
      },
    },
    schemas: {
      PromptRequest: {
        type: "object",
        required: ["prompt"],
        properties: {
          prompt: {
            type: "string",
            example: "Explain the architecture of a real-time notification system using WebSockets.",
          },
        },
      },
      AsyncPromptRequest: {
        type: "object",
        required: ["prompt", "callbackUrl"],
        properties: {
          prompt: {
            type: "string",
            example: "Analyze this architecture proposal and evaluate scalability tradeoffs.",
          },
          callbackUrl: {
            type: "string",
            example: "https://my-app.com/api/webhooks/har-callback",
          },
        },
      },
      Intent: {
        type: "object",
        properties: {
          complexity: { type: "string", enum: ["simple", "medium", "complex"] },
          sensitive: { type: "boolean" },
          taskType: { type: "string" },
          confidence: { type: "number" },
          reason: { type: "string" },
        },
      },
      HarResponse: {
        type: "object",
        properties: {
          prompt: { type: "string" },
          normalizedPrompt: { type: "string" },
          route: { type: "string", enum: ["LOCAL", "CLOUD", "HYBRID"] },
          finalProvider: { type: "string", enum: ["LOCAL", "CLOUD"] },
          model: { type: "string" },
          fallbackUsed: { type: "boolean" },
          intent: { $ref: "#/components/schemas/Intent" },
          result: { type: "string" },
          latencyMs: { type: "number" },
          success: { type: "boolean" },
        },
      },
    },
  },
  security: [
    {
      ApiKeyAuth: [],
    },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Check gateway service health",
        security: [],
        responses: {
          "200": {
            description: "Service is healthy",
          },
        },
      },
    },
    "/process": {
      post: {
        summary: "Process prompt synchronously with intelligent routing",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PromptRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Successfully processed prompt",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HarResponse" },
              },
            },
          },
          "401": { description: "Unauthorized: Missing or invalid API key" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/process/async": {
      post: {
        summary: "Process prompt asynchronously with webhook notification",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AsyncPromptRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Task queued successfully",
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
  },
};
