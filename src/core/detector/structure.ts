import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

interface StructureAnalysis {
  srcDirectory: string;
  keyDirectories: string[];
  keyFiles: string[];
  isMonorepo: boolean;
}

const commonDirectories = [
  "src",
  "app",
  "pages",
  "components",
  "lib",
  "utils",
  "hooks",
  "services",
  "repositories",
  "models",
  "controllers",
  "routes",
  "middleware",
  "tests",
  "__tests__",
  "public",
  "static",
  "assets",
  "styles",
  "config",
];

const importantFiles = [
  "README.md",
  "CLAUDE.md",
  ".cursorrules",
  ".clinerules",
  ".windsurfrules",
  "AGENTS.md",
  ".airules.yml",
  ".airules.yaml",
  "docker-compose.yml",
  "Dockerfile",
  ".env.example",
  "schema.prisma",
  "drizzle.config.ts",
];

const monorepoIndicators = [
  "packages",
  "apps",
  "turbo.json",
  "lerna.json",
  "pnpm-workspace.yaml",
  "nx.json",
];

export function analyzeStructure(cwd: string): StructureAnalysis {
  const keyDirectories: string[] = [];
  const isMonorepo = detectMonorepo(cwd);

  // Check for common directories
  for (const dir of commonDirectories) {
    const fullPath = join(cwd, dir);
    if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
      keyDirectories.push(dir);
    }
  }

  // Check for important files
  const keyFiles: string[] = [];
  for (const file of importantFiles) {
    if (existsSync(join(cwd, file))) {
      keyFiles.push(file);
    }
  }

  // Determine src directory
  const srcDirectory = keyDirectories.includes("src")
    ? "src"
    : keyDirectories.includes("app")
      ? "app"
      : ".";

  return {
    srcDirectory,
    keyDirectories,
    keyFiles,
    isMonorepo,
  };
}

function detectMonorepo(cwd: string): boolean {
  // Check for monorepo indicator files
  for (const file of monorepoIndicators) {
    if (existsSync(join(cwd, file))) {
      return true;
    }
  }

  // Check if packages/ or apps/ directory exists with subdirectories
  for (const dir of ["packages", "apps"]) {
    const fullPath = join(cwd, dir);
    if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
      const children = readdirSync(fullPath);
      const hasSubDirs = children.some((child) => {
        const childPath = join(fullPath, child);
        try {
          return statSync(childPath).isDirectory() && !child.startsWith(".");
        } catch {
          return false;
        }
      });
      if (hasSubDirs) {
        return true;
      }
    }
  }

  return false;
}
