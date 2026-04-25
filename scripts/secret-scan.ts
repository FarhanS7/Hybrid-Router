import fs from "fs";
import path from "path";

const SECRET_PATTERNS = [
  /sk-[a-zA-Z0-9]{48}/g,
  /AIza[0-9A-Za-z-_]{35}/g,
  /ghp_[a-zA-Z0-9]{36}/g,
  /xox[baprs]-[a-zA-Z0-9-]{10,}/g,
  /\b(password|api_key|secret|credential)\s*[:=]\s*["'][^"']{4,}["']/gi
];

const IGNORE_DIRS = ["node_modules", ".git", "dist", ".gemini", "artifacts"];
const IGNORE_FILES = [".env.example", "package-lock.json", "secret-scan.ts", "sensitivityPatterns.ts"];

function scanFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const findings: string[] = [];

  for (const pattern of SECRET_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      findings.push(...matches);
    }
  }

  return findings;
}

function walkDir(dir: string, callback: (filePath: string) => void) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        walkDir(fullPath, callback);
      }
    } else {
      if (!IGNORE_FILES.includes(file)) {
        callback(fullPath);
      }
    }
  }
}

console.log("🔍 Running Secret Scan...\n");
let totalFindings = 0;

walkDir(process.cwd(), (filePath) => {
  const findings = scanFile(filePath);
  if (findings.length > 0) {
    console.error(`❌ Found ${findings.length} potential secret(s) in ${filePath}:`);
    findings.forEach(f => console.error(`   - ${f.substring(0, 4)}...${f.substring(f.length - 4)}`));
    totalFindings += findings.length;
  }
});

if (totalFindings > 0) {
  console.error(`\n🚨 Secret scan failed with ${totalFindings} findings.`);
  process.exit(1);
} else {
  console.log("✅ No secrets found in tracked files.");
}
