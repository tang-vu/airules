import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { AirulesConfig } from "../config/schema.js";
import type { ProjectProfile } from "../detector/types.js";
import { AiderGenerator, assertAiderFileSafe } from "./aider.js";
import { AugmentGenerator } from "./augment.js";
import type { BaseGenerator } from "./base.js";
import { BoltGenerator } from "./bolt.js";
import { ClaudeGenerator } from "./claude.js";
import { ClineGenerator } from "./cline.js";
import { CodebuddyGenerator } from "./codebuddy.js";
import { CodexGenerator } from "./codex.js";
import { assertContextFileSafe, isContextTool, isManagedContextFile } from "./context-file.js";
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
  aider: () => new AiderGenerator(),
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
  const plannedContents = new Map<string, string>();

  for (const tool of tools) {
    const factory = generatorMap[tool];
    if (!factory) continue;

    const generator = factory();
    const content = generator.generate(profile, config);
    const outputPath = join(cwd, generator.outputPath);

    // Aider configuration can contain credentials. Do not access it through an output alias.
    if (tool === "aider") assertAiderFileSafe(outputPath);
    if (isContextTool(tool)) assertContextFileSafe(cwd, generator.outputPath);

    if (!force && (plannedContents.has(outputPath) || existsSync(outputPath))) {
      // Some targets share a path (Codex/OpenCode). Compare with earlier planned writes,
      // just as the original ordered writer compared with the bytes it had already saved.
      const existing = plannedContents.get(outputPath) ?? readFileSync(outputPath, "utf-8");
      if (existing === content) continue;
      if (!dryRun && isContextTool(tool) && !isManagedContextFile(existing)) {
        throw new Error(
          `Preserved existing ${generator.outputPath}: not managed by airules. Review or import its rules first, then use sync --target ${tool} --force to replace it.`,
        );
      }
    }

    results.push({ tool, path: generator.outputPath, content });
    plannedContents.set(outputPath, content);
  }

  // Preflight every selected destination before writing any of the generated files.
  if (!dryRun) {
    for (const result of results) {
      const outputPath = join(cwd, result.path);
      const dir = dirname(outputPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(outputPath, result.content, "utf-8");
    }
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
