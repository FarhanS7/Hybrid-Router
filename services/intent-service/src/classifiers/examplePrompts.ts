/**
 * Example prompts for embedding-based task classification.
 *
 * Quality here directly determines classification accuracy.
 * Each task type needs 7-15 DIVERSE examples — not variations
 * on the same phrase, but genuinely different ways a real user
 * might express the same intent.
 *
 * To improve accuracy for a specific task type:
 *   1. Run `npm run analyze:logs` to find low-confidence classifications
 *   2. Add the misclassified prompts (or similar ones) to the correct task type
 *   3. Restart intent-service to re-embed
 */
import type { TaskType } from "@har/shared";

export const TASK_EXAMPLES: Record<TaskType, string[]> = {
  greeting: [
    "hello there",
    "hi, how are you?",
    "good morning",
    "hey what's up",
    "howdy",
    "hey can you help me?",
    "hi claude",
    "good evening, I need some assistance",
  ],
  architecture: [
    "design a scalable notification system",
    "how should I architect a multi-tenant SaaS backend?",
    "what's the best way to structure a microservices system?",
    "system design for a real-time chat application",
    "design a distributed job queue",
    "how to build a high availability infrastructure",
    "architect a recommendation engine",
    "design an event-driven system with eventual consistency",
    "how would you design Twitter's feed system?",
    "plan the infrastructure for a video streaming platform",
    "how should I structure my backend services?",
    "create a system architecture for a payment processing pipeline",
  ],
  debugging: [
    "why is my function returning undefined?",
    "fix this stack trace",
    "my app crashes with a segfault",
    "getting a CORS error on my API call",
    "this loop runs infinitely, what's wrong?",
    "debug this memory leak in my Node service",
    "my SQL query returns no results but data exists",
    "TypeError: cannot read property of undefined",
    "the server returns 500 but the logs show nothing",
    "my Docker container keeps restarting",
    "this async function hangs and never resolves",
  ],
  reasoning: [
    "explain the tradeoffs between SQL and NoSQL",
    "compare and contrast REST vs GraphQL",
    "analyze the pros and cons of monorepo vs polyrepo",
    "think through the implications of this architectural decision",
    "evaluate whether I should use Redis or Memcached",
    "what are the arguments for and against microservices?",
    "help me think through this technical decision",
    "weigh the costs and benefits of serverless vs containers",
    "should I use TypeScript or stick with JavaScript?",
    "what are the security implications of storing tokens in localStorage?",
  ],
  code_help: [
    "write a function to reverse a linked list",
    "implement binary search in TypeScript",
    "write a regex to validate email addresses",
    "how do I write a debounce function?",
    "implement a rate limiter in JavaScript",
    "write unit tests for this function",
    "create a React hook for local storage",
    "show me how to use async generators in Node.js",
    "write a middleware for Express that logs request duration",
    "implement a simple LRU cache in Python",
  ],
  summary: [
    "summarize this document",
    "give me a TL;DR",
    "condense this article",
    "what are the key points from this?",
    "brief overview of this text",
    "shorten this paragraph",
    "extract the main ideas from this paper",
    "give me a quick summary of what happened",
  ],
  rewrite: [
    "rewrite this to be more professional",
    "rephrase this paragraph",
    "make this email more formal",
    "paraphrase this sentence",
    "reword this to be clearer",
    "improve the tone of this message",
    "clean up this sloppy writing",
    "make this sound less aggressive",
  ],
  formatting: [
    "format this as a markdown table",
    "convert this to bullet points",
    "prettify this JSON",
    "indent this code properly",
    "organize this list alphabetically",
    "turn this into a numbered list",
    "format this data as CSV",
  ],
  other: [],
};
