# ADR-001: Monorepo Architecture with Service Boundaries

## Status
Proposed

## Context
HAR needs to be modular, scalable, and recruiter-friendly. We need to decide on the structural organization of applications, services, and shared libraries.

## Decision
We will use a **monorepo** structure powered by **npm workspaces**.
- `apps/`: User-facing interfaces (CLI, Web).
- `services/`: Backend services for orchestration, intent classification, and LLM adapters.
- `packages/`: Shared libraries for types, config, and logging.

## Consequences
- **Pros**: Single source of truth for types; easy cross-service refactoring; simplified dependency management.
- **Cons**: Potential for circular dependencies (mitigated by clean boundaries); larger repository size.
