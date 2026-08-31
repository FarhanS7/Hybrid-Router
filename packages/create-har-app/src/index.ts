#!/usr/bin/env node
import * as p from "@clack/prompts";
import fs from "fs";
import path from "path";

async function main() {
  p.intro("🚀 Welcome to create-har-app — Hybrid AI Router Scaffolder");

  const project = await p.group(
    {
      projectName: () =>
        p.text({
          message: "What is your project name?",
          placeholder: "my-har-app",
          defaultValue: "my-har-app",
          validate: (val) => {
            if (!val) return "Project name cannot be empty";
            if (!/^[a-z0-9-_]+$/i.test(val)) return "Name must contain only alphanumeric characters and hyphens";
          },
        }),
      localModel: () =>
        p.select<any, string>({
          message: "Select preferred local LLM (Ollama):",
          options: [
            { value: "llama3.2", label: "Llama 3.2 (Recommended)" },
            { value: "phi3:mini", label: "Phi-3 Mini (Lightweight)" },
            { value: "mistral", label: "Mistral 7B" },
            { value: "custom", label: "Other / Custom" },
          ],
        }),
      cloudApiKey: () =>
        p.password({
          message: "Enter your Gemini/Cloud API Key (optional, stored in local .env only):",
        }),
      privacyMode: () =>
        p.select<any, string>({
          message: "Choose Privacy Mode:",
          options: [
            { value: "strict", label: "Strict (Block cloud for sensitive prompts)" },
            { value: "balanced", label: "Balanced (Redact PII before cloud reasoning)" },
          ],
        }),
    },
    {
      onCancel: () => {
        p.cancel("Operation cancelled.");
        process.exit(0);
      },
    }
  );

  const targetDir = path.resolve(process.cwd(), project.projectName);
  if (fs.existsSync(targetDir)) {
    p.cancel(`Directory '${project.projectName}' already exists.`);
    process.exit(1);
  }

  const s = p.spinner();
  s.start(`Creating project at ${project.projectName}...`);

  fs.mkdirSync(targetDir, { recursive: true });

  const envContent = `# HAR Environment Configuration
NODE_ENV=development
APP_API_KEY=har_dev_key_0123456789abcdef0123456789
GATEWAY_PORT=4000
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=${project.localModel === "custom" ? "llama3.2" : project.localModel}
CLOUD_PROVIDER=gemini
CLOUD_API_KEY=${project.cloudApiKey || ""}
CLOUD_MODEL=gemini-2.0-flash
PRIVACY_MODE=${project.privacyMode}
`;

  fs.writeFileSync(path.join(targetDir, ".env"), envContent);

  const packageJsonContent = {
    name: project.projectName,
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "npm run har:start",
    },
    dependencies: {
      "@har/client": "^1.0.0",
    },
  };

  fs.writeFileSync(path.join(targetDir, "package.json"), JSON.stringify(packageJsonContent, null, 2));

  s.stop("Project scaffolded successfully! 🎉");

  p.note(
    `Next steps:\n  cd ${project.projectName}\n  npm install\n  npm run dev`,
    "Quick Start"
  );
  p.outro("Happy routing!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
