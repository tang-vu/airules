import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "./run-cli.js";

let cwd: string;

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "airules-status-"));
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

function run(...args: string[]): string {
  const result = runCli(cwd, ...args);
  expect(result.status).toBe(0);
  return result.stdout;
}

describe("status CLI", () => {
  it("only reports configured outputs and preserves other rule files", () => {
    const otherRules = "# Hand-written agent instructions\n";
    writeFileSync(join(cwd, ".airules.yml"), "project:\n  name: example\ntargets: [claude]\n");
    writeFileSync(join(cwd, "AGENTS.md"), otherRules);

    run("sync", "--detect", "--target", "claude");
    const generated = readFileSync(join(cwd, "CLAUDE.md"), "utf8");
    const output = run("status", "--json");
    const result = JSON.parse(output);

    expect(result.diffs).toEqual([
      {
        file: "CLAUDE.md",
        tool: "claude",
        status: "unchanged",
        linesAdded: 0,
        linesRemoved: 0,
      },
    ]);
    expect(readFileSync(join(cwd, "CLAUDE.md"), "utf8")).toBe(generated);
    expect(readFileSync(join(cwd, "AGENTS.md"), "utf8")).toBe(otherRules);

    writeFileSync(join(cwd, "CLAUDE.md"), "outdated\n");
    const changedOutput = run("status");
    expect(changedOutput).toContain("~ CLAUDE.md");
    expect(changedOutput).not.toContain("AGENTS.md");
    expect(readFileSync(join(cwd, "CLAUDE.md"), "utf8")).toBe("outdated\n");
    expect(readFileSync(join(cwd, "AGENTS.md"), "utf8")).toBe(otherRules);
  });
});
