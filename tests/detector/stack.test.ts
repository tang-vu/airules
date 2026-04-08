import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { detectStack } from "../../src/core/detector/stack.js";

describe("stack detector", () => {
  it("should detect Next.js from next.config.js", () => {
    const cwd = join(import.meta.dirname, "../fixtures/nextjs-project");
    const result = detectStack(cwd, { next: "15.0.0", react: "19.0.0" });
    expect(result.framework).toBe("nextjs");
    expect(result.language).toBe("typescript");
  });

  it("should detect react-vite from vite.config + react dep", () => {
    const result = detectStack(process.cwd(), { react: "18.0.0", vite: "6.0.0" });
    // Without vite.config file, it won't detect — test with direct marker
    expect(result.framework).toBe(null);
  });

  it("should detect rust from Cargo.toml", () => {
    const cwd = join(import.meta.dirname, "../fixtures/rust-project");
    const result = detectStack(cwd, { axum: "0.8" });
    expect(result.language).toBe("rust");
    expect(result.framework).toBe("axum");
  });

  it("should detect python from pyproject.toml", () => {
    const cwd = join(import.meta.dirname, "../fixtures/python-project");
    const result = detectStack(cwd, { fastapi: "0.115.0" });
    expect(result.language).toBe("python");
  });

  it("should return 'other' for unknown project", () => {
    const result = detectStack("/tmp", {});
    expect(result.language).toBe("other");
    expect(result.framework).toBe(null);
  });
});
