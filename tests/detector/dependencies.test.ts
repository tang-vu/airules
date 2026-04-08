import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { detectPatterns, parsePackageJson } from "../../src/core/detector/dependencies.js";

describe("dependency analyzer", () => {
  it("should parse package.json dependencies", () => {
    const cwd = join(import.meta.dirname, "../fixtures/nextjs-project");
    const result = parsePackageJson(cwd);
    expect(result.dependencies.next).toBe("15.0.0");
    expect(result.devDependencies.typescript).toBe("^5.8.0");
    expect(result.allDependencies.zustand).toBe("^5.0.0");
  });

  it("should return empty for non-existent package.json", () => {
    const result = parsePackageJson("/nonexistent-path-xyz");
    expect(result.dependencies).toEqual({});
    expect(result.devDependencies).toEqual({});
  });

  it("should detect testing framework from dependencies", () => {
    const patterns = detectPatterns({ vitest: "^3.0.0" }, process.cwd());
    expect(patterns.hasTesting).toBe(true);
    expect(patterns.testingFramework).toBe("vitest");
  });

  it("should detect CSS framework from dependencies", () => {
    const patterns = detectPatterns({ tailwindcss: "^4.0.0" }, process.cwd());
    expect(patterns.hasCSSFramework).toBe(true);
    expect(patterns.cssFramework).toBe("Tailwind CSS");
  });

  it("should detect state management from dependencies", () => {
    const patterns = detectPatterns({ zustand: "^5.0.0" }, process.cwd());
    expect(patterns.stateManagement).toBe("Zustand");
  });

  it("should detect linter from dependencies", () => {
    const patterns = detectPatterns({ "@biomejs/biome": "^1.9.0" }, process.cwd());
    expect(patterns.hasLinter).toBe(true);
    expect(patterns.linter).toBe("Biome");
  });

  it("should detect package manager from lock files", () => {
    const patterns = detectPatterns({}, process.cwd());
    // Should detect npm since we have package-lock.json
    expect(patterns.packageManager).toBe("npm");
  });
});
