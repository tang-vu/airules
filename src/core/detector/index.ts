import { basename } from "node:path";
import { detectPatterns, parsePackageJson } from "./dependencies.js";
import { analyzeGit } from "./git.js";
import { detectStack } from "./stack.js";
import { analyzeStructure } from "./structure.js";
import type { ProjectProfile } from "./types.js";

export async function detectProject(cwd: string): Promise<ProjectProfile> {
  // Parse dependencies
  const { dependencies, devDependencies, allDependencies } = parsePackageJson(cwd);

  // Detect patterns from dependencies
  const patterns = detectPatterns(allDependencies, cwd);

  // Detect stack
  const { language, framework } = detectStack(cwd, allDependencies);

  // Analyze structure
  const structure = analyzeStructure(cwd);

  // Analyze git
  const gitInfo = analyzeGit(cwd);

  // Build project name from directory
  const name = basename(cwd);

  // Build detected patterns list
  const detectedPatterns: string[] = [];
  if (patterns.testingFramework) detectedPatterns.push(`${patterns.testingFramework}-testing`);
  if (patterns.cssFramework)
    detectedPatterns.push(`${patterns.cssFramework.toLowerCase().replace(/\s+/g, "-")}`);
  if (patterns.stateManagement)
    detectedPatterns.push(`${patterns.stateManagement.toLowerCase().replace(/\s+/g, "-")}`);
  if (patterns.linter) detectedPatterns.push(`${patterns.linter.toLowerCase()}-linter`);
  if (framework === "nextjs" && structure.keyDirectories.includes("app")) {
    detectedPatterns.push("app-router");
  }
  if (allDependencies.prisma || allDependencies["@prisma/client"]) {
    detectedPatterns.push("prisma-orm");
  }
  if (allDependencies.drizzle || allDependencies["drizzle-orm"]) {
    detectedPatterns.push("drizzle-orm");
  }
  detectedPatterns.push(...gitInfo.recentCommitPatterns);

  return {
    name,
    language,
    framework,
    packageManager: patterns.packageManager,
    hasTypeScript: patterns.hasTypeScript,
    hasTesting: patterns.hasTesting,
    testingFramework: patterns.testingFramework,
    hasLinter: patterns.hasLinter,
    linter: patterns.linter,
    hasCSSFramework: patterns.hasCSSFramework,
    cssFramework: patterns.cssFramework,
    stateManagement: patterns.stateManagement,
    isMonorepo: structure.isMonorepo,
    srcDirectory: structure.srcDirectory,
    keyDirectories: structure.keyDirectories,
    keyFiles: structure.keyFiles,
    dependencies,
    devDependencies,
    detectedPatterns: [...new Set(detectedPatterns)],
  };
}
