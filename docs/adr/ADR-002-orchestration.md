# ADR-002: Service-Oriented Orchestration

## Status
Proposed

## Context
HAR routes prompts between local and cloud LLMs. We need to decide where the routing logic and fallback management reside.

## Decision
We will use a dedicated **Orchestrator** service.
- It acts as the "brain" of the system.
- It manages the request lifecycle: Intent -> Decision -> Execution -> Fallback.

## Consequences
- **Pros**: Centralized routing logic; isolated failure handling; easier observability of decisions.
- **Cons**: Potential single point of failure (mitigated by redundancy and health checks).
