# HAR — Hybrid AI Router 🚀

**HAR** is a developer-first AI orchestration layer that intelligently routes prompts between **Local LLMs**, **Cloud LLMs**, and **Hybrid Execution** pipelines.

Optimize your AI applications for **cost**, **speed**, **privacy**, and **reliability** by choosing the right intelligence for every prompt.

---

## ⚡ Quick Start (5 Minutes)

1.  **Install Ollama**: [Download here](https://ollama.com/) and ensure it's running.
2.  **Pull a Local Model**:
    ```bash
    ollama run phi3:mini
    ```
3.  **Clone & Setup**:
    ```bash
    git clone https://github.com/your-repo/har.git
    cd har
    cp .env.example .env
    npm install
    ```
4.  **Add Cloud Keys (Optional)**:
    Add your `CLOUD_API_KEY` to `.env` to enable Cloud and Hybrid routing. HAR works perfectly in **LOCAL-only mode** without keys.
5.  **Run HAR**:
    ```bash
    npm run dev
    ```
6.  **Route your first prompt**:
    ```bash
    # Open a new terminal
    npm link-local # If you haven't linked the 'har' command yet
    har "Rewrite this sentence: 'the cat sat on the mat'"
    ```

---

## 🧠 What is HAR?

HAR doesn't just call an API; it evaluates the **Intent** and **Sensitivity** of your prompt to decide the best execution path:

-   **LOCAL**: Fast, free, and private. Best for simple rewrites, summaries, or sensitive data.
-   **CLOUD**: High intelligence. Best for complex reasoning, architecture, or deep debugging.
-   **HYBRID**: Multi-step pipelines (e.g., Local Cleanup → Cloud Reasoning → Local Formatting).

---

## 🛠️ CLI Usage

```bash
# Basic usage
har "How do I fix a leaky faucet?"

# Verbose mode (shows execution trace)
har "Design a scalable rate limiter" --verbose

# JSON output for integration
har "Explain quantum entanglement" --json

# Run a system health check
har doctor
```

---

## 🏗️ Architecture

```text
User Prompt
     │
     ▼
┌──────────────┐      ┌─────────────────┐
│  Gateway     │ ────▶│ Intent Service  │ (Rule-based detection)
└──────────────┘      └─────────────────┘
     │                       │
     ▼                       ▼
┌──────────────┐      ┌─────────────────┐
│ Orchestrator │ ────▶│ Routing Policy  │ (LOCAL vs CLOUD vs HYBRID)
└──────────────┘      └─────────────────┘
     │
     ├─▶ LOCAL  (Ollama / Phi-3)
     ├─▶ CLOUD  (Gemini / GPT-4)
     └─▶ HYBRID (Local Pre-process ⮕ Cloud Reason ⮕ Local Post-process)
```

---

## 📋 Supported & Tested Models

-   **Local (Ollama)**: `phi3:mini` (Recommended), `llama3.2`, `mistral`
-   **Cloud**: `gemini-2.0-flash` (Default), `gpt-4o`

---

## 🩺 Troubleshooting

-   **Ollama unreachable?** Run `ollama serve`.
-   **Cloud routing failing?** Check your `CLOUD_API_KEY` in `.env`.
-   **Port conflict?** HAR uses ports 4000-4004. Ensure they are free.
-   **Command not found?** Run `npm link --workspace @har/cli` or use `node apps/cli/dist/index.js`.

---

## 🧪 Demo

To see HAR in action across all execution modes, run:
```bash
npm run demo
```
