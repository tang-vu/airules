import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "./run-cli.js";

let cwd: string;

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "airules-check-"));
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

function run(...args: string[]) {
  return runCli(cwd, ...args);
}

describe("check CLI after development branch reconciliation", () => {
  it.each(["claud", "", "constructor", "__proto__"])(
    "rejects unsupported selected target %j in JSON and human modes",
    (target) => {
      writeFileSync(join(cwd, ".airules.yml"), "targets: [claude]\n");
      const json = run("check", "--json", "--target", target);
      expect(json.status).toBe(2);
      expect(JSON.parse(json.stdout)).toEqual({
        ok: false,
        error: expect.stringContaining("Unsupported target"),
        changes: [],
      });
      const text = run("check", "--target", target);
      expect(text.status).toBe(2);
      expect(text.stdout).toContain("Unsupported target");
      expect(text.stdout).not.toContain("files are in sync");
      expect(existsSync(join(cwd, "CLAUDE.md"))).toBe(false);
    },
  );

  it.each(["[aider]", "[claude, aider]"])("checks supported Aider selections: %s", (targets) => {
    writeFileSync(join(cwd, ".airules.yml"), `targets: ${targets}\n`);
    const result = run("check", "--json");
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: false,
      checked: targets === "[aider]" ? 1 : 2,
      changes: expect.arrayContaining([
        expect.objectContaining({ file: "AIDER.md", tool: "aider", status: "added" }),
      ]),
    });

    // An explicit supported target overrides the configured selection.
    const selected = run("check", "--json", "--target", "claude");
    expect(selected.status).toBe(1);
    expect(JSON.parse(selected.stdout)).toMatchObject({ ok: false, checked: 1, changed: 1 });
  });

  it("preserves an intentionally empty target selection", () => {
    writeFileSync(join(cwd, ".airules.yml"), "targets: []\n");
    const result = run("check", "--json");
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ ok: true, checked: 0, changed: 0, changes: [] });
  });

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
