import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface ImportSource {
  tool: string;
  file: string;
  content: string;
}

export interface ImportResult {
  sources: ImportSource[];
  extractedRules: string[];
  detectedStack: string | null;
}

const IMPORTABLE_FILES = [
  { tool: "claude", file: "CLAUDE.md" },
  { tool: "cursor", file: ".cursorrules" },
  { tool: "copilot", file: ".github/copilot-instructions.md" },
  { tool: "windsurf", file: ".windsurfrules" },
  { tool: "cline", file: ".clinerules" },
  { tool: "codex", file: "AGENTS.md" },
];

function isRuleLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // Skip markdown headers that are structural (not rules)
  if (trimmed.startsWith("#") && trimmed.length < 40) return false;
  // Skip empty lines, pure code blocks
  if (trimmed.startsWith("```")) return false;
  // Must have some substance
  if (trimmed.length < 10) return false;
  return true;
}

function cleanRuleLine(line: string): string {
  let cleaned = line.trim();
  // Remove markdown list markers
  cleaned = cleaned.replace(/^[-*+]\s*/, "");
  // Remove markdown bold markers
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, "$1");
  // Remove trailing punctuation if it's just a list item
  cleaned = cleaned.trim();
  return cleaned;
}

export function findExistingConfigs(cwd: string): ImportSource[] {
  const sources: ImportSource[] = [];
  for (const { tool, file } of IMPORTABLE_FILES) {
    const fullPath = join(cwd, file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, "utf-8");
      sources.push({ tool, file, content });
    }
  }
  return sources;
}

export function extractRulesFromContent(content: string): string[] {
  const lines = content.split("\n");
  const rules: string[] = [];

  for (const line of lines) {
    if (isRuleLine(line)) {
      const cleaned = cleanRuleLine(line);
      if (cleaned.length > 5) {
        rules.push(cleaned);
      }
    }
  }

  return [...new Set(rules)];
}

export function detectStackFromExisting(content: string): string | null {
  const lower = content.toLowerCase();
  const stacks = [
    "nextjs",
    "react",
    "vue",
    "angular",
    "svelte",
    "nuxt",
    "astro",
    "express",
    "fastify",
    "django",
    "fastapi",
    "flask",
    "rails",
    "laravel",
  ];
  for (const stack of stacks) {
    if (lower.includes(stack)) return stack;
  }
  return null;
}

export function importExistingConfigs(cwd: string): ImportResult {
  const sources = findExistingConfigs(cwd);
  const allRules: string[] = [];
  let detectedStack: string | null = null;

  for (const source of sources) {
    const rules = extractRulesFromContent(source.content);
    allRules.push(...rules);
    const stack = detectStackFromExisting(source.content);
    if (stack) detectedStack = stack;
  }

  return {
    sources,
    extractedRules: [...new Set(allRules)],
    detectedStack,
  };
}
