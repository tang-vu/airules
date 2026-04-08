import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface ParsedDependencies {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  allDependencies: Record<string, string>;
}

interface DetectedPatterns {
  hasTypeScript: boolean;
  hasTesting: boolean;
  testingFramework: string | null;
  hasLinter: boolean;
  linter: string | null;
  hasCSSFramework: boolean;
  cssFramework: string | null;
  stateManagement: string | null;
  packageManager: "npm" | "yarn" | "pnpm" | "bun";
}

const testingFrameworks: Record<string, string> = {
  vitest: "vitest",
  jest: "jest",
  "@jest/core": "jest",
  pytest: "pytest",
  "cargo-test": "cargo-test",
  mocha: "mocha",
  ava: "ava",
  tape: "tape",
};

const cssFrameworks: Record<string, string> = {
  tailwindcss: "Tailwind CSS",
  "styled-components": "styled-components",
  "@emotion/react": "Emotion",
  sass: "Sass",
  less: "Less",
  bulma: "Bulma",
  bootstrap: "Bootstrap",
  "@mui/material": "Material UI",
};

const stateManagers: Record<string, string> = {
  zustand: "Zustand",
  redux: "Redux",
  "@reduxjs/toolkit": "Redux Toolkit",
  jotai: "Jotai",
  recoil: "Recoil",
  mobx: "MobX",
  pinia: "Pinia",
  vuex: "Vuex",
  xstate: "XState",
};

const linters: Record<string, string> = {
  "@biomejs/biome": "Biome",
  eslint: "ESLint",
  ruff: "Ruff",
  clippy: "Clippy",
  rubocop: "RuboCop",
  golangci: "golangci-lint",
};

export function parsePackageJson(cwd: string): ParsedDependencies {
  const packageJsonPath = join(cwd, "package.json");
  if (!existsSync(packageJsonPath)) {
    return { dependencies: {}, devDependencies: {}, allDependencies: {} };
  }

  try {
    const content = readFileSync(packageJsonPath, "utf-8");
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const deps = (parsed.dependencies ?? {}) as Record<string, string>;
    const devDeps = (parsed.devDependencies ?? {}) as Record<string, string>;

    return {
      dependencies: deps,
      devDependencies: devDeps,
      allDependencies: { ...deps, ...devDeps },
    };
  } catch {
    return { dependencies: {}, devDependencies: {}, allDependencies: {} };
  }
}

export function detectPatterns(
  allDependencies: Record<string, string>,
  cwd: string,
): DetectedPatterns {
  const detect = (map: Record<string, string>): string | null => {
    for (const [dep, name] of Object.entries(map)) {
      if (allDependencies[dep]) {
        return name;
      }
    }
    return null;
  };

  return {
    hasTypeScript: Boolean(allDependencies.typescript),
    hasTesting: detect(testingFrameworks) !== null,
    testingFramework: detect(testingFrameworks),
    hasLinter: detect(linters) !== null,
    linter: detect(linters),
    hasCSSFramework: detect(cssFrameworks) !== null,
    cssFramework: detect(cssFrameworks),
    stateManagement: detect(stateManagers),
    packageManager: detectPackageManager(cwd),
  };
}

function detectPackageManager(cwd: string): "npm" | "yarn" | "pnpm" | "bun" {
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(cwd, "yarn.lock"))) return "yarn";
  if (existsSync(join(cwd, "bun.lockb")) || existsSync(join(cwd, "bun.lock"))) return "bun";
  return "npm";
}
