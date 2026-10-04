import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "./run-cli.js";

let cwd: string;

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "airules-json-"));
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

function configure(): void {
  writeFileSync(join(cwd, ".airules.yml"), "project:\n  name: example\ntargets: [claude]\n");
}

describe("packaged CLI JSON output", () => {
  it("preserves the status success shape without prose or update requests", () => {
    configure();
    const result = runCli(cwd, "status", "--json");
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      config: true,
      diffs: [
        {
          file: "CLAUDE.md",
          tool: "claude",
          status: "added",
          linesAdded: expect.any(Number),
          linesRemoved: 0,
        },
      ],
    });
  });

  it("preserves the score success shape without prose or update requests", () => {
    configure();
    const result = runCli(cwd, "score", "--json");
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({
      project: basename(cwd),
      scores: {
        completeness: expect.any(Number),
        specificity: expect.any(Number),
        coverage: expect.any(Number),
        customRules: expect.any(Number),
        security: expect.any(Number),
        overall: expect.any(Number),
        grade: expect.any(String),
      },
      suggestions: expect.any(Array),
      timestamp: expect.any(String),
    });
  });

  it.each(["status", "score", "check"])("keeps %s human output and update notices", (command) => {
    configure();
    const result = runCli(cwd, command);
    expect(result.status).toBe(command === "check" ? 1 : 0);
    expect(result.stdout).toContain(`airules ${command}`);
    expect(result.stdout).toContain("Update available:");
    expect(result.stdout).toContain("→ 9.9.9");
    expect(result.fetchRequests).toEqual(["https://registry.npmjs.org/@tangvu/airules/latest"]);
  });

  describe.each(["missing", "invalid"])("%s configuration", (kind) => {
    it.each([
      {
        command: "status",
        exit: 0,
        response: { config: false, error: "config-not-found", diffs: [] },
      },
      { command: "score", exit: 1, response: { error: "config-not-found" } },
      {
        command: "check",
        exit: 2,
        response: { ok: false, error: "config-not-found", changes: [] },
      },
    ])("returns JSON for $command with its existing exit code", ({ command, exit, response }) => {
      if (kind === "invalid") writeFileSync(join(cwd, ".airules.yml"), "project: [unfinished\n");
      const result = runCli(cwd, command, "--json");
      expect(result.status).toBe(exit);
      expect(JSON.parse(result.stdout)).toEqual(response);
    });
  });

  it.each([
    { command: "status", exit: 0 },
    { command: "check", exit: 2 },
  ])("returns JSON for $command when a generated file cannot be read", ({ command, exit }) => {
    configure();
    mkdirSync(join(cwd, "CLAUDE.md"));
    const result = runCli(cwd, command, "--json");
    expect(result.status).toBe(exit);
    expect(JSON.parse(result.stdout)).toMatchObject({ error: expect.stringContaining("EISDIR") });
  });
});
