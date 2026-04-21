"use client";

import { useState } from "react";
import styles from "./page.module.css";

interface Intent {
  complexity: string;
  sensitive: boolean;
  taskType: string;
  confidence: number;
}

interface HarResponse {
  prompt: string;
  normalizedPrompt: string;
  intent: Intent;
  route: string;
  result: string;
  model?: string;
  latencyMs: number;
  success: boolean;
  fallbackUsed: boolean;
}

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:4000";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HarResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${GATEWAY_URL}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || `Request failed (${res.status})`);
        return;
      }

      const data: HarResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to gateway");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleAccent}>HAR</span> — Hybrid AI Router
        </h1>
        <p className={styles.subtitle}>
          Route prompts intelligently between local and cloud LLMs
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          id="prompt-input"
          className={styles.input}
          type="text"
          placeholder="Enter your prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
        />
        <button
          id="submit-btn"
          className={styles.submitBtn}
          type="submit"
          disabled={loading || !prompt.trim()}
        >
          {loading ? "Processing..." : "Send"}
        </button>
      </form>

      {loading && <div className={styles.loading}>⏳ Processing your prompt...</div>}

      {error && <div className={styles.errorBox}>❌ {error}</div>}

      {result && (
        <div className={styles.resultCard}>
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Route</span>
              <span className={`${styles.metaValue} ${result.route === "LOCAL" ? styles.routeLocal : styles.routeCloud}`}>
                {result.route}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Task Type</span>
              <span className={styles.metaValue}>{result.intent.taskType}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Complexity</span>
              <span className={styles.metaValue}>{result.intent.complexity}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Sensitive</span>
              <span className={styles.metaValue}>{result.intent.sensitive ? "Yes" : "No"}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Confidence</span>
              <span className={styles.metaValue}>{result.intent.confidence}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Latency</span>
              <span className={styles.metaValue}>{result.latencyMs}ms</span>
            </div>
            {result.model && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Model</span>
                <span className={styles.metaValue}>{result.model}</span>
              </div>
            )}
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Success</span>
              <span className={styles.metaValue}>{result.success ? "✅" : "❌"}</span>
            </div>
          </div>

          <hr className={styles.divider} />

          <div className={styles.resultLabel}>Response</div>
          <div className={styles.resultText}>{result.result}</div>
        </div>
      )}
    </main>
  );
}
