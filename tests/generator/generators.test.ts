import { describe, expect, it } from "vitest";
import type { AirulesConfig } from "../../src/core/config/schema.js";
import type { ProjectProfile } from "../../src/core/detector/types.js";
import { ClaudeGenerator } from "../../src/core/generator/claude.js";
import { CopilotGenerator } from "../../src/core/generator/copilot.js";
import { CursorGenerator } from "../../src/core/generator/cursor.js";

const mockProfile: ProjectProfile = {
  name: "test-app",
  language: "typescript",
  framework: "nextjs",
  packageManager: "npm",
  hasTypeScript: true,
  hasTesting: true,
  testingFramework: "vitest",
  hasLinter: true,
  linter: "Biome",
  hasCSSFramework: true,
  cssFramework: "Tailwind CSS",
  stateManagement: "Zustand",
  isMonorepo: false,
  srcDirectory: "src",
  keyDirectories: ["src", "components"],
  keyFiles: [".airules.yml"],
  dependencies: { next: "15.0.0", react: "19.0.0" },
  devDependencies: { typescript: "^5.8.0" },
  detectedPatterns: ["vitest-testing", "app-router"],
};

const mockConfig: AirulesConfig = {
  version: 1,
  project: { name: "test-app", stack: "nextjs", language: "typescript" },
  targets: ["claude", "cursor", "copilot"],
  rules: {
    style: {
      prefer_functional: true,
      naming_convention: "camelCase",
      import_style: "named",
      quote_style: "double",
    },
    architecture: {
      pattern: "feature-based",
      api_style: "server-actions",
      state_management: "zustand",
    },
    testing: {
      framework: "vitest",
      style: "arrange-act-assert",
      min_coverage: 80,
      require_tests_for: ["utils"],
    },
    git: { commit_style: "conventional", branch_pattern: "feature/*", require_pr: true },
    docs: { require_jsdoc: false, language: "english" },
    security: {
      no_secrets_in_code: true,
      sanitize_inputs: true,
      prefer_parameterized_queries: true,
    },
    performance: { lazy_load_images: true, prefer_server_components: true },
  },
  custom: ["Never use `any` type", "Use server components by default"],
  exclude: ["node_modules"],
};

describe("Claude generator", () => {
  it("should generate valid markdown", () => {
    const gen = new ClaudeGenerator();
    const output = gen.generate(mockProfile, mockConfig);
    expect(output).toContain("# Project: test-app");
    expect(output).toContain("## Tech Stack");
    expect(output).toContain("## Code Style");
    expect(output).toContain("## Testing");
    expect(output).toContain("## Git Conventions");
    expect(output).toContain("Never use `any` type");
  });
});

describe("Cursor generator", () => {
  it("should generate valid markdown", () => {
    const gen = new CursorGenerator();
    const output = gen.generate(mockProfile, mockConfig);
    expect(output).toContain("# test-app — Cursor Rules");
    expect(output).toContain("## Code Style");
    expect(output).toContain("Never use `any` type");
  });
});

describe("Copilot generator", () => {
  it("should generate valid markdown", () => {
    const gen = new CopilotGenerator();
    const output = gen.generate(mockProfile, mockConfig);
    expect(output).toContain("# GitHub Copilot Instructions for test-app");
    expect(output).toContain("## Code Style Guidelines");
  });
});
