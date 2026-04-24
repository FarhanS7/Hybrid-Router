# 🚀 HAR — Hybrid AI Router

> An intelligent routing engine that decides when to use local models, cloud models, or both.

HAR is a developer-first control layer for LLM execution. It analyzes the intent and complexity of your prompts to select the most efficient path—saving costs, protecting privacy, and ensuring your application stays online even when cloud providers fail.

### How it Works
```mermaid
graph TD
    User([User]) --> CLI[CLI / Web UI]
    CLI --> GW[Gateway Service]
    GW --> ORC[Orchestrator]
    ORC --> INT[Intent Service]
    ORC --> LOC[Local LLM Service]
    ORC --> CLD[Cloud LLM Service]
    
    INT --> |Classify| ORC
    LOC --> |Ollama| ORC
    CLD --> |Gemini/GPT| ORC
    
    ORC --> |Execute Result| GW
    GW --> |Structured Response| CLI
```

---

## 💡 Why HAR?

Not every prompt needs a trillion-parameter cloud model. Using the right tool for the job leads to better systems:

| Feature | Local LLM | Cloud LLM | **HAR (Hybrid)** |
| :--- | :--- | :--- | :--- |
| **Cost** | Free (Your hardware) | High (Usage-based) | **Optimized** |
| **Privacy** | Maximum (Data stays local) | Variable (External API) | **Privacy-Aware** |
| **Speed** | Low Latency (Local) | Higher Latency (Network) | **Balanced** |
| **Reliability** | Works Offline | Fragile (Network/Outages) | **Automatic Fallback** |

---

## ✨ Features

- **Smart Routing**: Categorizes prompts (e.g., chat, architecture, sensitive) to choose the best model.
- **Hybrid Execution**: Performs local pre-processing (cleanup/summarization) before sending refined context to the cloud.
- **Resilience First**: Built-in timeouts, retries, and automatic local fallback if cloud keys or networks fail.
- **Explainable AI**: Transparent "Execution Trace" that tells you *why* a specific route was chosen using deterministic logic.
- **CLI-First DX**: A polished terminal interface with structured output, JSON support, and system diagnostics.
- **Security Hardened**: CLI-to-Gateway communication is secured via `x-api-key` validation.

---

## ⏱️ Quick Start (5 Minutes)

HAR is designed to work out of the box with [Ollama](https://ollama.ai/).

### 1. Install & Run Ollama
Download Ollama from [ollama.com](https://ollama.com/) and pull a supported model:
```bash
ollama run llama3.2
```

### 2. Setup HAR
Clone the repository and install dependencies:
```bash
git clone https://github.com/FarhanS7/Hybrid-Router.git
cd Hybrid-Router
npm install
npm run build
```

### 3. Setup CLI
Choose one of the following methods to run the `har` command:

**Option A: Link Globally (Recommended)**
```bash
npm link --workspace apps/cli
har doctor
```

**Option B: No-link usage**
```bash
npm run cli -- doctor
```

### 4. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```
Open `.env` and set your local model (e.g., `OLLAMA_MODEL=llama3.2`). 
*Note: If you don't provide a `CLOUD_API_KEY`, HAR automatically operates in **LOCAL-only mode**.*

**Important**: Ensure `APP_API_KEY` matches between your services and CLI (default is `har_dev_key`).

### 5. Run & Verify
Start the background services:
```bash
# This starts the Gateway, Orchestrator, Intent Service, and Web Dashboard
npm run dev
```
In a new terminal, try your first route:
```bash
har "What is the capital of France?" --verbose
```

---

## 💻 CLI Usage

The HAR CLI is the primary way to interact with the router.

```bash
# Simple prompt (usually routed to LOCAL)
har "What is the capital of France?"

# Complex prompt with verbose trace (usually routed to CLOUD)
har "Design a scalable notification system using Redis and WebSockets" --verbose

# Integration-friendly JSON output
har "Rewrite: 'hey how r u'" --json

# Check system health
har doctor
```

### Flags:
- `--verbose`: Shows internal intent detection, routing reasoning, and granular hybrid steps.
- `--json`: Returns raw structured data (prompt, route, latency, results).
- `--no-color`: Disables ANSI colors for logs.

---

## 🎯 How HAR Decides

HAR uses a multi-stage orchestrator to evaluate every request with **deterministic reasoning**:

*   **LOCAL**: Simple tasks (greetings, text rewriting, summarization) or prompts containing sensitive data (PII/Secrets).
*   **CLOUD**: Complex reasoning, architecture design, or deep coding tasks that require larger parameter counts.
*   **HYBRID**: Multi-step workflows. For example, "Analyze these messy logs and design a fix" might use LOCAL to clean the logs and CLOUD to propose the fix.

---

## 🛡️ Reliability & Resilience

HAR treats resilience as a first-class citizen:
- **Timeouts**: Prevents your application from hanging on a slow provider.
- **Retries**: Automatically retries failed requests with exponential backoff.
- **Fallback**: If a cloud request fails, HAR instantly re-routes the prompt to your local model.
- **Privacy Guard**: Prompts tagged as "sensitive" or containing PII are restricted to local execution.

---

## 🏗️ Project Structure

```text
apps/
  cli/             # Main developer interface
  web/             # Web dashboard (Experimental)

services/
  gateway/         # Entry point for all requests
  orchestrator/    # Routing logic & LangGraph state machine
  intent-service/  # Prompt classification engine
  local-llm/       # Ollama provider bridge
  cloud-llm/       # Gemini/OpenAI provider bridge

packages/
  shared/          # Common types & interfaces
  config/          # Environment & policy management
  logger/          # Structured logging (Pino)
```

---

## ⚙️ Configuration

Key settings in `.env`:
- `APP_API_KEY`: Secure key for CLI-to-Gateway communication.
- `OLLAMA_BASE_URL`: Usually `http://localhost:11434`
- `LOCAL_MODEL`: Your preferred local model (e.g., `llama3.2`, `phi3`)
- `CLOUD_API_KEY`: Required for cloud routing (e.g., Gemini or OpenAI)
- `CLOUD_PROVIDER`: Set to `gemini` or `openai`
- `MAX_PROMPT_CHARS`: Maximum prompt length (default: 12000)
- `ALLOW_CLOUD_FALLBACK`: Whether to try local models if cloud fails.

---

## 🗺️ Roadmap & Status

### **Completed (V1.0)**
- ✅ Core Routing & Intent Detection
- ✅ Multi-Service Orchestration (LangGraph)
- ✅ Hybrid Execution (Local → Cloud)
- ✅ Explainable Routing Reasons
- ✅ CLI with Verbose/JSON modes
- ✅ Health Check Diagnostics (`har doctor`)
- ✅ Security Hardening (API Key validation)

### **Planned**
- 🛠️ Adaptive Learning (Routing based on previous performance)
- 🛠️ Evaluation Framework (Benchmarking local vs cloud accuracy)
- 🛠️ More Providers (Anthropic, Mistral, Local vLLM)
- 🛠️ Web-based Analytics Dashboard

---

## 🤝 Contributing

We welcome contributions! Whether it's adding a new provider, improving routing logic, or fixing a typo in the docs:
1. Fork the repo.
2. Create a feature branch.
3. Submit a Pull Request.

---

## 🧠 Philosophy

> Not every problem needs the most powerful model; every problem needs the most efficient solution.