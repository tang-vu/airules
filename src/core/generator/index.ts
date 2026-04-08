import { dirname, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AirulesConfig } from "../config/schema.js";
import type { ProjectProfile } from "../detector/types.js";
import { AugmentGenerator } from "./augment.js";
import type { BaseGenerator } from "./base.js";
import { BoltGenerator } from "./bolt.js";
import { ClaudeGenerator } from "./claude.js";
import { ClineGenerator } from "./cline.js";
import { CodebuddyGenerator } from "./codebuddy.js";
import { CodexGenerator } from "./codex.js";
import { CopilotGenerator } from "./copilot.js";
import { CursorGenerator } from "./cursor.js";
import { GeminiGenerator } from "./gemini.js";
import { KiloCodeGenerator } from "./kilocode.js";
import { OpenCodeGenerator } from "./opencode.js";
import { QwenGenerator } from "./qwen.js";
import { RooGenerator } from "./roo.js";
import { WindsurfGenerator } from "./windsurf.js";

const generatorMap: Record<string, () => BaseGenerator> = {
  claude: () => new ClaudeGenerator(),
  cursor: () => new CursorGenerator(),
  copilot: () => new CopilotGenerator(),
  windsurf: () => new WindsurfGenerator(),
  cline: () => new ClineGenerator(),
  codex: () => new CodexGenerator(),
  qwen: () => new QwenGenerator(),
  gemini: () => new GeminiGenerator(),
  augment: () => new AugmentGenerator(),
  codebuddy: () => new CodebuddyGenerator(),
  opencode: () => new OpenCodeGenerator(),
  roo: () => new RooGenerator(),
  kilocode: () => new KiloCodeGenerator(),
  bolt: () => new BoltGenerator(),
};

export interface GeneratedFile {
  tool: string;
  path: string;
  content: string;
}

export function generateAll(
  profile: ProjectProfile,
  config: AirulesConfig,
  cwd: string,
  dryRun = false,
  force = false,
  targetTool?: string,
): GeneratedFile[] {
  const tools = targetTool ? [targetTool] : (config.targets ?? ["claude", "cursor", "copilot"]);
  const results: GeneratedFile[] = [];

  for (const tool of tools) {
    const factory = generatorMap[tool];
    if (!factory) continue;

    const generator = factory();
    const content = generator.generate(profile, config);
    const outputPath = join(cwd, generator.outputPath);

    if (!force && existsSync(outputPath)) {
      const existing = readFileSync(outputPath, "utf-8");
      if (existing === content) continue;
    }

    if (!dryRun) {
      const dir = dirname(outputPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(outputPath, content, "utf-8");
    }

    results.push({ tool, path: generator.outputPath, content });
  }

  return results;
}

export function getGeneratorInfo(
  tool: string,
): { name: string; outputPath: string; description: string } | null {
  const factory = generatorMap[tool];
  if (!factory) return null;
  const gen = factory();
  return { name: gen.toolName, outputPath: gen.outputPath, description: gen.description };
}

export function listGenerators(): string[] {
  return Object.keys(generatorMap);
}
