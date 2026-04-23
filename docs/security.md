# Security & Privacy Architecture

This document outlines the security measures and privacy boundaries implemented in HAR.

## 1. Privacy Boundary

HAR is designed to handle sensitive data safely. The privacy boundary is enforced at the **Orchestrator** and **Intent Service** levels.

### Sensitivity Detection
The `intent-service` uses a combination of keyword matching and regex patterns to identify sensitive content, including:
- Emails
- Phone numbers
- Credit card numbers
- Social Security Numbers (SSN)
- Security keywords (password, api key, etc.)

### Redaction Pipeline
When a prompt is identified as sensitive but requires high-reasoning (triggering a `HYBRID` route), it follows this flow:
1. **Local Preprocess**: The local LLM (Ollama) receives the raw prompt with instructions to redact all PII.
2. **Cloud Reason**: The redacted (clean) output is sent to the cloud provider.
3. **Local Postprocess**: The cloud's reasoning is returned to the local layer for final formatting.

This ensures that the cloud provider never sees the raw sensitive information.

## 2. Authentication

### Gateway Security
The Gateway is the only public-facing service. It requires an API key for all processing requests.

- **Header**: `X-API-KEY`
- **Config**: Set `APP_API_KEY` in your `.env` file.

### Internal Service Isolation
Internal services (`orchestrator`, `intent-service`, `local-llm`, `cloud-llm`) are bound to `127.0.0.1`. They are not accessible from outside the host machine, providing a layer of defense-in-depth.

## 3. Secure Logging

HAR uses `pino` for structured logging with security-conscious defaults:
- **Redaction**: Fields like `apiKey`, `token`, `password`, and `auth` are automatically replaced with `[REDACTED]` in logs.
- **No Prompt Logging**: Raw user prompts are excluded from logs in the `intent-service` and truncated to 100 chars in other services to minimize exposure.

## 4. Cloud Provider Security

- **Headers over Query Params**: API keys for cloud providers (e.g., Gemini) are sent in HTTP headers (`x-goog-api-key`), not in the URL query string, to prevent leakage in logs or proxy captures.
- **Timeout Protection**: All cloud calls have strict timeouts to prevent resource exhaustion and hanging connections.
