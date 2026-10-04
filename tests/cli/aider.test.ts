import {
  existsSync,
  linkSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCli } from "./run-cli.js";

let cwd: string;
const authoredRules = "# Aider Conventions\n- Preserve the team's existing API contracts.\n";
const userConfig =
  "# Keep this exact comment\nread: [TEAM.md]\nunknown-option: keep\nopenai-api-key: test-sentinel-not-a-real-key\n";

function read(file: string): string {
  return readFileSync(join(cwd, file), "utf8");
}

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "airules-aider-cli-"));
  writeFileSync(join(cwd, ".aider.conf.yml"), userConfig);
  writeFileSync(join(cwd, "CONVENTIONS.md"), authoredRules);
  writeFileSync(join(cwd, "TEAM.md"), authoredRules);
  writeFileSync(join(cwd, ".aider.model.settings.yml"), "# User model settings\n");
});

afterEach(() => {
  expect(read(".aider.conf.yml")).toBe(userConfig);
  expect(read("CONVENTIONS.md")).toBe(authoredRules);
  expect(read("TEAM.md")).toBe(authoredRules);
  expect(read(".aider.model.settings.yml")).toBe("# User model settings\n");
  rmSync(cwd, { recursive: true, force: true });
});

describe("Aider CLI workflow", () => {
  it.each(["symlink", "hardlink"])(
    "never reads or overwrites user config through an AIDER.md %s",
    (kind) => {
      const source = join(cwd, ".aider.conf.yml");
      const destination = join(cwd, "AIDER.md");
      if (kind === "symlink") symlinkSync(source, destination);
      else linkSync(source, destination);
      const init = runCli(cwd, "init", "--target", "aider");
      expect(init.status).toBe(0);
      expect(init.stdout).toContain("Preserved existing AIDER.md");
      writeFileSync(join(cwd, ".airules.yml"), "targets: [aider]\n");
      for (const args of [
        ["sync", "--target", "aider"],
        ["sync", "--target", "aider", "--force"],
        ["sync", "--target", "aider", "--dry-run"],
        ["import", "--force"],
        ["import", "--force", "--dry-run"],
        ["check", "--json", "--target", "aider"],
        ["status", "--json"],
        ["init", "--force", "--target", "aider"],
      ]) {
        const result = runCli(cwd, ...args);
        expect(result.status).toBe(args[0] === "check" ? 2 : args[0] === "status" ? 0 : 1);
        expect(result.stdout).toContain("regular file with a single link");
        expect(result.stdout).not.toContain("test-sentinel");
        expect(read(".aider.conf.yml")).toBe(userConfig);
        expect(read(".airules.yml")).not.toContain("test-sentinel");
        expect(read(".airules.yml")).not.toContain("unknown-option");
      }
    },
  );

  it("generates one explicitly selected file and explains loading without changing default targets", () => {
    const result = runCli(cwd, "init", "--target", "aider");
    expect(result.status).toBe(0);
    expect(read("AIDER.md")).toContain("# Aider Conventions");
    expect(result.stdout).toContain("aider --read AIDER.md");
    expect(read(".airules.yml")).not.toContain("- aider");
    expect(existsSync(join(cwd, "CLAUDE.md"))).toBe(false);
  });

  it("preserves an existing AIDER.md on init and replaces it only with force", () => {
    writeFileSync(join(cwd, "AIDER.md"), authoredRules);
    const result = runCli(cwd, "init", "--target", "aider");
    expect(result.status).toBe(0);
    expect(read("AIDER.md")).toBe(authoredRules);
    expect(result.stdout).toContain("Preserved existing AIDER.md");
    const forced = runCli(cwd, "init", "--target", "aider", "--force");
    expect(forced.status).toBe(0);
    expect(read("AIDER.md")).not.toBe(authoredRules);
  });

  it("keeps forced dry-run init read-only", () => {
    writeFileSync(join(cwd, "AIDER.md"), authoredRules);
    const result = runCli(cwd, "init", "--target", "aider", "--force", "--dry-run");
    expect(result.status).toBe(0);
    expect(read("AIDER.md")).toBe(authoredRules);
    expect(existsSync(join(cwd, ".airules.yml"))).toBe(false);
  });

  it("checks missing, clean and modified conventions while keeping JSON output clean", () => {
    writeFileSync(
      join(cwd, ".airules.yml"),
      "targets: [aider]\ncustom:\n  - Preserve all public interfaces\n",
    );
    writeFileSync(join(cwd, "package.json"), '{"devDependencies":{"typescript":"^5"}}');
    let result = runCli(cwd, "check", "--json");
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: false,
      checked: 1,
      changed: 1,
      changes: [{ file: "AIDER.md", tool: "aider", status: "added" }],
    });
    const synced = runCli(cwd, "sync", "--target", "aider");
    expect(synced.status).toBe(0);
    expect(read("AIDER.md")).toContain("Preserve all public interfaces");
    expect(synced.stdout).toContain("aider --read AIDER.md");
    result = runCli(cwd, "check", "--json", "--target", "aider");
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ ok: true, checked: 1, changed: 0, changes: [] });
    const status = runCli(cwd, "status", "--json");
    expect(JSON.parse(status.stdout).diffs).toEqual([
      { file: "AIDER.md", tool: "aider", status: "unchanged", linesAdded: 0, linesRemoved: 0 },
    ]);
    writeFileSync(join(cwd, "AIDER.md"), authoredRules);
    result = runCli(cwd, "check", "--json");
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).changes[0]).toMatchObject({
      file: "AIDER.md",
      status: "modified",
    });
    expect(read("AIDER.md")).toBe(authoredRules);
  });

  it("sync regenerates only the selected conventions and dry-run preserves their bytes", () => {
    writeFileSync(
      join(cwd, ".airules.yml"),
      "targets: [claude, aider]\ncustom:\n  - Keep customer data private\n",
    );
    writeFileSync(join(cwd, "AIDER.md"), authoredRules);
    writeFileSync(join(cwd, "CLAUDE.md"), authoredRules);
    expect(runCli(cwd, "sync", "--target", "aider", "--dry-run", "--force").status).toBe(0);
    expect(read("AIDER.md")).toBe(authoredRules);
    expect(runCli(cwd, "sync", "--target", "aider").status).toBe(0);
    expect(read("AIDER.md")).toContain("Keep customer data private");
    expect(read("CLAUDE.md")).toBe(authoredRules);
    expect(JSON.parse(runCli(cwd, "check", "--json", "--target", "aider").stdout).checked).toBe(1);
    expect(JSON.parse(runCli(cwd, "check", "--json").stdout).checked).toBe(2);
  });

  it("imports AIDER.md through existing force and dry-run protections", () => {
    writeFileSync(join(cwd, "AIDER.md"), authoredRules);
    expect(runCli(cwd, "import", "--dry-run").status).toBe(0);
    expect(existsSync(join(cwd, ".airules.yml"))).toBe(false);
    expect(runCli(cwd, "import").status).toBe(0);
    expect(read(".airules.yml")).toContain("Preserve the team's existing API contracts.");
    expect(read(".airules.yml")).not.toContain("test-sentinel");
    const config = read(".airules.yml");
    expect(runCli(cwd, "import").status).toBe(1);
    expect(read(".airules.yml")).toBe(config);
    expect(runCli(cwd, "import", "--force", "--dry-run").status).toBe(0);
    expect(read(".airules.yml")).toBe(config);
    expect(runCli(cwd, "import", "--force").status).toBe(0);
    expect(read("AIDER.md")).toBe(authoredRules);
  });
});
