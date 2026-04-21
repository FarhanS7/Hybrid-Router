# HAR Architecture - Context & Container Diagrams

## Context Diagram (C4 Level 1)
High-level view of how HAR interacts with users and LLM providers.

- **User**: Interacts via CLI or Web.
- **HAR**: The Hybrid AI Router system.
- **Local LLM (Ollama)**: Locally hosted model.
- **Cloud LLM (OpenAI/Anthropic)**: Remote cloud provider.

## Container Diagram (C4 Level 2)
Internals of the HAR system.

- **Gateway**: Entry point / API Gateway.
- **Orchestrator**: Routing engine and workflow manager.
- **Intent Service**: Classification of user input.
- **Adapters**: Local-LLM and Cloud-LLM isolation layers.
