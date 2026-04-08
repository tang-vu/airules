import { describe, expect, it } from "vitest";
import type { AirulesConfig } from "../../src/core/config/schema.js";
import type { ProjectProfile } from "../../src/core/detector/types.js";
import { scoreProject } from "../../src/core/scorer/index.js";
import {
  calculateOverallScore,
  scoreToGrade,
  scoringCriteria,
} from "../../src/core/scorer/rules.js";

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
  keyDirectories: ["src"],
  keyFiles: [],
  dependencies: {},
  devDependencies: {},
  detectedPatterns: [],
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
    architecture: { pattern: "feature-based", api_style: "rest" },
    testing: { framework: "vitest", style: "arrange-act-assert", require_tests_for: [] },
    git: { commit_style: "conventional", branch_pattern: "feature/*", require_pr: true },
    docs: { require_jsdoc: false, language: "english" },
    security: {
      no_secrets_in_code: true,
      sanitize_inputs: true,
      prefer_parameterized_queries: true,
    },
    performance: { lazy_load_images: false, prefer_server_components: false },
  },
  custom: ["Never use any type"],
  exclude: ["node_modules"],
};

describe("scorer", () => {
  it("should calculate scores for a project", () => {
    const { scores } = scoreProject(mockProfile, mockConfig);
    expect(scores.overall).toBeGreaterThan(0);
    expect(scores.overall).toBeLessThanOrEqual(100);
    expect(["S", "A", "B", "C", "D"]).toContain(scores.grade);
  });

  it("should have higher score with more targets", () => {
    const fullConfig = {
      ...mockConfig,
      targets: ["claude", "cursor", "copilot", "windsurf", "cline", "codex"],
    };
    const { scores: fullScores } = scoreProject(mockProfile, fullConfig);
    const { scores: partialScores } = scoreProject(mockProfile, mockConfig);
    expect(fullScores.coverage).toBeGreaterThan(partialScores.coverage);
  });

  it("should suggest improvements when missing sections", () => {
    const minimalConfig: AirulesConfig = {
      version: 1,
      project: { name: "test" },
      targets: ["claude"],
      rules: {
        style: {},
        architecture: {},
        testing: {},
        git: {},
        docs: {},
        security: {},
        performance: {},
      },
      custom: [],
      exclude: [],
    };
    const { suggestions } = scoreProject(mockProfile, minimalConfig);
    expect(suggestions.length).toBeGreaterThan(0);
  });
});

describe("scoring criteria", () => {
  it("should have 5 criteria with total weight 1.0", () => {
    const totalWeight = scoringCriteria.reduce((sum, c) => sum + c.weight, 0);
    expect(totalWeight).toBeCloseTo(1, 5);
    expect(scoringCriteria).toHaveLength(5);
  });

  it("should calculate overall score correctly", () => {
    const scores = [100, 80, 60, 40, 20];
    const weights = [0.25, 0.25, 0.2, 0.15, 0.15];
    const overall = calculateOverallScore(scores, weights);
    expect(overall).toBe(66);
  });
});

describe("grade conversion", () => {
  it("should assign correct grade", () => {
    expect(scoreToGrade(100)).toBe("S");
    expect(scoreToGrade(95)).toBe("S");
    expect(scoreToGrade(90)).toBe("A");
    expect(scoreToGrade(85)).toBe("A");
    expect(scoreToGrade(80)).toBe("B");
    expect(scoreToGrade(70)).toBe("B");
    expect(scoreToGrade(60)).toBe("C");
    expect(scoreToGrade(50)).toBe("C");
    expect(scoreToGrade(40)).toBe("D");
    expect(scoreToGrade(0)).toBe("D");
  });
});
