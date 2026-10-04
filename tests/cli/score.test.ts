import { afterEach, describe, expect, it, vi } from "vitest";
import { scoreCommand } from "../../src/cli/commands/score.js";
import { airulesConfigSchema } from "../../src/core/config/schema.js";

vi.mock("../../src/core/config/loader.js", () => ({
  loadConfig: () => airulesConfigSchema.parse({}),
}));
vi.mock("../../src/core/detector/index.js", () => ({
  detectProject: () => Promise.reject(new Error("Unable to inspect project")),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("score errors", () => {
  it("reports analysis failures as JSON with the existing error exit code", async () => {
    const originalExitCode = process.exitCode;
    const output = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await scoreCommand({ json: true });
      expect(process.exitCode).toBe(1);
      expect(JSON.parse(output.mock.calls.map((args) => args.join(" ")).join("\n"))).toEqual({
        error: "Unable to inspect project",
      });
    } finally {
      process.exitCode = originalExitCode;
    }
  });
});
