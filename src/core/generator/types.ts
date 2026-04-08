import type { BaseGenerator } from "./base.js";

export interface GeneratorRegistry {
  [key: string]: BaseGenerator;
}

export const GENERATOR_MAP: Record<string, string> = {
  claude: "CLAUDE.md",
  cursor: ".cursorrules",
  copilot: ".github/copilot-instructions.md",
  windsurf: ".windsurfrules",
  cline: ".clinerules",
  codex: "AGENTS.md",
  aider: ".aider.conf.yml",
  qwen: ".qwenrules",
  gemini: ".gemini/rules.md",
  augment: ".augment/rules.md",
  codebuddy: ".codebuddy/rules.md",
  opencode: "AGENTS.md",
  roo: ".roo/rules.md",
  kilocode: ".kilocode/rules.md",
  bolt: ".bolt/rules.md",
};
