import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeStructure } from "../../src/core/detector/structure.js";

describe("structure analyzer", () => {
  it("should detect src directory in nextjs project", () => {
    const cwd = join(import.meta.dirname, "../fixtures/nextjs-project");
    const result = analyzeStructure(cwd);
    expect(result.srcDirectory).toBe("src");
    expect(result.keyDirectories).toContain("src");
    expect(result.keyDirectories).toContain("components");
    expect(result.keyDirectories).toContain("lib");
  });

  it("should not detect monorepo in simple project", () => {
    const cwd = join(import.meta.dirname, "../fixtures/nextjs-project");
    const result = analyzeStructure(cwd);
    expect(result.isMonorepo).toBe(false);
  });

  it("should return empty for non-existent directory", () => {
    const result = analyzeStructure("/nonexistent-path-xyz-12345");
    expect(result.srcDirectory).toBe(".");
    expect(result.keyDirectories).toEqual([]);
    expect(result.isMonorepo).toBe(false);
  });
});
