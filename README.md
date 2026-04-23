# 🚀 HAR — Hybrid AI Router

> An AI routing engine that decides when to use **local models**, **cloud models**, or **both**.

---

## 🧠 What is HAR?

HAR (Hybrid AI Router) is a **decision + execution layer for AI systems**.

Instead of sending every prompt to a single model, HAR analyzes the request and chooses:

- 🖥️ LOCAL (fast, free, private)
- ☁️ CLOUD (high reasoning)
- 🔀 HYBRID (multi-step execution)

### Traditional

```
Prompt → One Model → Response
```

### HAR

```
Prompt
 → Intent Detection
 → Decision Engine
 → LOCAL | CLOUD | HYBRID
 → Response + Metadata
```

---

## ❓ Why HAR?

| Problem | HAR Solution |
|--------|------------|
| Expensive cloud usage | Uses local models when possible |
| Privacy risks | Keeps sensitive data local |
| API failures | Retry + fallback system |
| No transparency | Shows routing decisions |
| Complex tasks | Hybrid execution |

---

## ⚡ Features

- 🧭 Smart routing (LOCAL / CLOUD / HYBRID)
- 🔀 Conditional hybrid execution
- 🛡️ Resilience (retry, timeout, fallback)
- 🔍 Explainability (`--verbose`)
- 🧰 CLI-first developer tool

---

## 🏗️ Architecture

### High-Level Flow

```
User (CLI/Web)
      ↓
   Gateway
      ↓
 Orchestrator (LangGraph)
      ↓
 Intent Detection
      ↓
 Decision Engine
      ↓
 ┌───────────────┬───────────────┬───────────────┐
 │     LOCAL     │     CLOUD     │    HYBRID     │
 │               │               │               │
 ▼               ▼               ▼
Local LLM     Cloud LLM     Multi-step plan
(Ollama)      (API)         LOCAL → CLOUD → LOCAL
```

---

### Orchestration Flow

```
START
 → normalizePrompt
 → detectIntent
 → decideRoute
   ├─ LOCAL  → executeLocal
   ├─ CLOUD  → executeCloud
   └─ HYBRID → executePlan
 → finalizeResponse
 → END
```

---

### Resilience Flow

```
Provider Call
   │
   ├─ success → return
   │
   └─ failure
        → retry (1x)
        → fallback (if safe)
        → block (if sensitive)
        → safe error response
```

---

## ⚡ Quick Start (5 min)

### 1. Install Ollama

```
ollama serve
ollama run phi3:mini
```

---

### 2. Clone repo

```
git clone https://github.com/your-username/har.git
cd har
```

---

### 3. Setup env

```
cp .env.example .env
```

Edit:

```
OLLAMA_BASE_URL=http://localhost:11434
LOCAL_MODEL=phi3:mini

# optional
CLOUD_API_KEY=
CLOUD_MODEL=gemini-2.0-flash
```

👉 No cloud key = LOCAL-only mode (works fine)

---

### 4. Run

```
npm install
npm run dev
```

---

### 5. Verify

```
har doctor
```

---

## 🧪 Usage

### Basic

```
har "hello"
```

---

### Verbose (debug mode)

```
har "design a scalable system" --verbose
```

Shows:
- intent
- route
- reason
- retries
- fallback

---

### JSON (integration)

```
har "hello" --json
```

---

### Doctor

```
har doctor
```

---

## 🧠 How HAR Decides

### LOCAL
```
har "rewrite this sentence"
```

✔ fast  
✔ free  
✔ private  

---

### CLOUD
```
har "design distributed system"
```

✔ strong reasoning  

---

### HYBRID
```
har "clean messy notes and explain"
```

```
LOCAL → preprocess
CLOUD → reason
LOCAL → format
```

---

---

## 🛡️ Security & Privacy

HAR is built with a **Privacy-First** architecture to ensure sensitive data is never exposed to cloud providers without explicit protection.

### 🔒 Privacy-Aware Routing
- **Sensitivity Detection**: Automatic detection of PII (Emails, Phones, SSNs, Credit Cards) and sensitive keywords.
- **Local Redaction**: For `HYBRID` routes, HAR performs local redaction of sensitive data before passing it to cloud reasoners. The cloud only sees the "cleaned" context.
- **Privacy Override**: Sensitive prompts that do not require cloud reasoning are forced to the `LOCAL` route.

### 🔑 Authentication
- **Gateway Auth**: All requests to the HAR Gateway require a valid `X-API-KEY` header.
- **Secure Configuration**: API keys are managed via environment variables and are never logged.

### 📜 Secure Logging
- **Automatic Redaction**: The internal logger automatically redacts API keys, tokens, and authorization headers from all logs.
- **PII Stripping**: Raw prompt content is stripped from intent logs to prevent accidental PII storage.

### 🌐 Network Hardening
- **Local Binding**: All internal microservices bind strictly to `127.0.0.1`, preventing external exposure.
- **CORS Policy**: Restricted CORS origins in production to prevent cross-origin attacks.

---

## 📂 Project Structure

```
apps/
  cli/
  web/

services/
  gateway/
  orchestrator/
  intent-service/
  local-llm/
  cloud-llm/

packages/
  shared/
  config/
  logger/
```

---

## ⚙️ Config

```
OLLAMA_BASE_URL=http://localhost:11434
LOCAL_MODEL=phi3:mini

CLOUD_API_KEY=
CLOUD_MODEL=gemini-2.0-flash

LOCAL_TIMEOUT_MS=15000
CLOUD_TIMEOUT_MS=12000
MAX_RETRIES=1
```

---

## 🚧 Status

### Done
- ✅ Routing
- ✅ Orchestration
- ✅ Resilience
- ✅ Hybrid execution
- ✅ CLI

### Next
- ⏳ Optimization
- ⏳ Evaluation
- ⏳ UI polish

---

## 🤝 Contributing

Ideas:
- routing improvements
- hybrid logic
- providers
- benchmarks

---

## 🧠 Philosophy

```
Not every problem needs the most powerful model.
```

```
The intelligence is in choosing the right model
for the right task
at the right time
```

---

## ⭐ Support

Star the repo if useful.

---

## 📄 License

MIT