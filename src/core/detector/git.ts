import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

interface GitInfo {
  hasGit: boolean;
  recentCommitPatterns: string[];
}

export function analyzeGit(cwd: string): GitInfo {
  const hasGit = existsSync(join(cwd, ".git"));
  const recentCommitPatterns: string[] = [];

  if (!hasGit) {
    return { hasGit, recentCommitPatterns };
  }

  // Try to read recent commit messages via git log
  try {
    const logOutput = execSync("git log --oneline -20", { cwd, encoding: "utf-8" });
    const lines = logOutput.split("\n").filter(Boolean);

    for (const line of lines) {
      // Detect conventional commit patterns
      if (/^feat(\(.+\))?:/.test(line)) recentCommitPatterns.push("conventional-commits");
      if (/^fix(\(.+\))?:/.test(line)) recentCommitPatterns.push("conventional-commits");
    }
  } catch {
    // git not available or no commits
  }

  // Deduplicate
  return { hasGit, recentCommitPatterns: [...new Set(recentCommitPatterns)] };
}
