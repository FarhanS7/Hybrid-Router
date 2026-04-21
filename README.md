# HAR - Hybrid AI Router

Modular monorepo for intelligent AI prompt routing between local and cloud LLMs.

## Architecture

HAR uses a service-oriented architecture:
- **Gateway**: Entry point for all requests.
- **Orchestrator**: Core logic for decision making and fallback routing.
- **Intent Service**: Classifies prompt complexity and sensitivity.
- **Local LLM Adapter**: Interface for Ollama/local models.
- **Cloud LLM Adapter**: Interface for GPT/Claude/cloud models.

## Phase 1 Progress

- [x] Monorepo structure initialized.
- [x] Shared packages (shared, config, logger) scaffolded.
- [x] All 5 core services scaffolded with health checks.
- [x] CLI and Web app skeletons ready.

## Setup

```bash
npm install
npm run dev
```

## Workspaces

- `apps/cli`: Commander-based CLI.
- `apps/web`: Next.js web interface.
- `services/*`: Core backend services.
- `packages/*`: Internal libraries.
