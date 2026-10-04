import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "tsup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
let buildDir: string;
let cwd: string;

beforeAll(async () => {
  // Keep dependencies resolvable while building a fresh CLI independently of dist/.
  buildDir = mkdtempSync(join(repoRoot, "node_modules", ".airules-cli-test-"));
  await build({
    entry: [join(repoRoot, "src/cli/index.ts")],
    outDir: buildDir,
    format: ["esm"],
    outExtension: () => ({ js: ".mjs" }),
    target: "node18",
    config: false,
    dts: false,
    silent: true,
  });
});

afterAll(() => {
  rmSync(buildDir, { recursive: true, force: true });
});

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "airules-status-"));
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

function run(...args: string[]): string {
  return execFileSync(process.execPath, [join(buildDir, "index.mjs"), ...args], {
    cwd,
    encoding: "utf8",
    timeout: 10000,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

describe("status CLI", () => {
  it("only reports configured outputs and preserves other rule files", () => {
    const otherRules = "# Hand-written agent instructions\n";
    writeFileSync(join(cwd, ".airules.yml"), "project:\n  name: example\ntargets: [claude]\n");
    writeFileSync(join(cwd, "AGENTS.md"), otherRules);

    run("sync", "--detect", "--target", "claude");
    const generated = readFileSync(join(cwd, "CLAUDE.md"), "utf8");
    const output = run("status", "--json");
    // Status currently prints a heading before its JSON payload.
    const result = JSON.parse(output.slice(output.indexOf("{")));

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
