import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "tsup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
let buildDir: string;
let cwd: string;

beforeAll(async () => {
  buildDir = mkdtempSync(join(repoRoot, "node_modules", ".airules-check-test-"));
  // The isolated source bundle has no package metadata, so the CLI's optional
  // update check is caught before any registry request. Parse stdout unmodified.
  await build({
    entry: [join(repoRoot, "src/cli/index.ts")],
    outDir: join(buildDir, "cli"),
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
  cwd = mkdtempSync(join(tmpdir(), "airules-check-"));
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

function run(...args: string[]) {
  const result = spawnSync(process.execPath, [join(buildDir, "cli/index.mjs"), ...args], {
    cwd,
    encoding: "utf8",
    timeout: 10000,
    stdio: ["ignore", "pipe", "pipe"],
  });
  expect(result.error).toBeUndefined();
  expect(result.signal).toBeNull();
  return result;
}

describe("check CLI after development branch reconciliation", () => {
  it.each(["[claude]", "[claude, codex]"])(
    "checks a selected target while preserving other rules with targets: %s",
    (targets) => {
      const config = `# Preserve config comments\nproject:\n  name: example\ntargets: ${targets}\n`;
      const otherRules = "# Hand-written agent instructions\n";
      writeFileSync(join(cwd, ".airules.yaml"), config);
      writeFileSync(join(cwd, "AGENTS.md"), otherRules);

      expect(run("sync", "--detect", "--target", "claude").status).toBe(0);
      const generated = readFileSync(join(cwd, "CLAUDE.md"), "utf8");
      const init = run("init", "--target", "claude");
      expect(init.status).toBe(1);
      expect(init.stdout).toContain("Preserved existing .airules.yaml");

      const check = run("check", "--json", "--target", "claude");
      expect(check.status).toBe(0);
      expect(JSON.parse(check.stdout)).toEqual({ ok: true, checked: 1, changed: 0, changes: [] });
      const text = run("check", "--target", "claude");
      expect(text.status).toBe(0);
      expect(text.stdout).toContain("Generated AI rule files are in sync");
      expect(text.stdout).not.toContain("AGENTS.md");
      expect(readFileSync(join(cwd, "CLAUDE.md"), "utf8")).toBe(generated);
      expect(readFileSync(join(cwd, "AGENTS.md"), "utf8")).toBe(otherRules);
      expect(readFileSync(join(cwd, ".airules.yaml"), "utf8")).toBe(config);
      expect(existsSync(join(cwd, ".airules.yml"))).toBe(false);

      const all = run("check", "--json");
      const result = JSON.parse(all.stdout);
      expect(all.status).toBe(targets === "[claude]" ? 0 : 1);
      expect(result.checked).toBe(targets === "[claude]" ? 1 : 2);
      expect(result.changes).toEqual(
        targets === "[claude]"
          ? []
          : [expect.objectContaining({ file: "AGENTS.md", tool: "codex", status: "modified" })],
      );
      expect(readFileSync(join(cwd, "AGENTS.md"), "utf8")).toBe(otherRules);
    },
  );

  it("returns drift for missing and modified selected output without changing any files", () => {
    writeFileSync(join(cwd, ".airules.yml"), "project:\n  name: example\ntargets: [claude]\n");
    writeFileSync(join(cwd, "AGENTS.md"), "# Preserve me\n");

    const missing = run("check", "--json", "--target", "claude");
    expect(missing.status).toBe(1);
    expect(JSON.parse(missing.stdout)).toMatchObject({
      ok: false,
      checked: 1,
      changed: 1,
      changes: [{ file: "CLAUDE.md", status: "added" }],
    });
    expect(existsSync(join(cwd, "CLAUDE.md"))).toBe(false);

    writeFileSync(join(cwd, "CLAUDE.md"), "outdated\n");
    const modified = run("check", "--json", "--target", "claude");
    expect(modified.status).toBe(1);
    expect(JSON.parse(modified.stdout)).toMatchObject({
      ok: false,
      checked: 1,
      changed: 1,
      changes: [{ file: "CLAUDE.md", status: "modified" }],
    });
    expect(readFileSync(join(cwd, "CLAUDE.md"), "utf8")).toBe("outdated\n");
    expect(readFileSync(join(cwd, "AGENTS.md"), "utf8")).toBe("# Preserve me\n");
  });

  it("returns a configuration error when there is no config", () => {
    const result = run("check", "--json");
    expect(result.status).toBe(2);
    expect(JSON.parse(result.stdout)).toEqual({
      ok: false,
      error: "config-not-found",
      changes: [],
    });
    expect(existsSync(join(cwd, ".airules.yml"))).toBe(false);
  });
});
