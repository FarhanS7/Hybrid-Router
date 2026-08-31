import { pipeline, env } from "@xenova/transformers";
import type { TaskType } from "@har/shared";

// Cache model files locally in root .model-cache directory
env.cacheDir = "./.model-cache";

type EmbeddingVector = number[];

export interface EmbeddingClassificationResult {
  taskType: TaskType;
  confidence: number; // 0.0 - 1.0 cosine similarity
  method: "embedding";
}

let embedder: Awaited<ReturnType<typeof pipeline>> | null = null;
let exampleEmbeddings: Map<TaskType, EmbeddingVector[]> = new Map();
let isReady = false;

export function isEmbeddingEngineReady(): boolean {
  return isReady;
}

/**
 * Pre-computes embedding vectors for all task examples at startup.
 */
export async function initEmbeddingEngine(examples: Record<string, string[]>): Promise<void> {
  embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
    quantized: true,
  });

  exampleEmbeddings.clear();

  for (const [taskType, prompts] of Object.entries(examples)) {
    const vectors: EmbeddingVector[] = [];
    for (const prompt of prompts) {
      const output = (await embedder(prompt, { pooling: "mean", normalize: true })) as unknown as { data: Float32Array };
      vectors.push(Array.from(output.data));
    }
    exampleEmbeddings.set(taskType as TaskType, vectors);
  }

  isReady = true;
}

/**
 * Classifies an incoming prompt by cosine similarity against example vectors.
 */
export async function classifyByEmbedding(prompt: string): Promise<EmbeddingClassificationResult> {
  if (!embedder || !isReady) {
    throw new Error("Embedding engine is not initialized");
  }

  const output = (await embedder(prompt, { pooling: "mean", normalize: true })) as unknown as { data: Float32Array };
  const promptVector = Array.from(output.data) as EmbeddingVector;

  let bestTask: TaskType = "other";
  let bestScore = 0;

  for (const [taskType, vectors] of exampleEmbeddings.entries()) {
    if (vectors.length === 0) continue;

    // Highest similarity among examples for this task type
    const scores = vectors.map((v) => cosineSimilarity(promptVector, v));
    const maxScore = Math.max(...scores);

    if (maxScore > bestScore) {
      bestScore = maxScore;
      bestTask = taskType;
    }
  }

  return {
    taskType: bestTask,
    confidence: Number(bestScore.toFixed(4)),
    method: "embedding",
  };
}

/**
 * Cosine similarity between two L2-normalized vectors.
 * Since vectors are normalized, dot product equals cosine similarity.
 */
function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }
  return dotProduct;
}
