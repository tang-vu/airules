import {
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CONTEXT_FILE_MARKER } from "../../src/core/generator/context-file.js";
import { runCli } from "./run-cli.js";

let cwd: string;
const authored = "# Team instructions\n- Keep the existing public API contracts stable.\n";
const legacyContent = "# Legacy instructions\n- Retain hand-edited migration rules.\n";
const targets = [
  { tool: "gemini", file: "GEMINI.md", legacy: ".gemini/rules.md" },
  { tool: "qwen", file: "QWEN.md", legacy: ".qwenrules" },
];

function read(file: string): string {
  return readFileSync(join(cwd, file), "utf8");
}
function write(file: string, content: string): void {
  mkdirSync(dirname(join(cwd, file)), { recursive: true });
  writeFileSync(join(cwd, file), content);
}
function expectClean(tool: string, file: string): void {
  const check = runCli(cwd, "check", "--json", "--target", tool);
  expect(check.status).toBe(0);
  expect(JSON.parse(check.stdout)).toEqual({ ok: true, checked: 1, changed: 0, changes: [] });
  const status = JSON.parse(runCli(cwd, "status", "--json").stdout);
  expect(status.diffs).toContainEqual({
    file,
    tool,
    status: "unchanged",
    linesAdded: 0,
    linesRemoved: 0,
  });
}

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "airules-context-cli-"));
  // Deliberately differ from absent or explicitly configured stack/language.
  write("next.config.js", "export default {};\n");
  write("package.json", '{"dependencies":{"react":"19"},"devDependencies":{"typescript":"5"}}');
});
afterEach(() => rmSync(cwd, { recursive: true, force: true }));

describe.each(targets)("$tool context-file workflow", ({ tool, file, legacy }) => {
  it("initializes the default context filename without changing saved targets", () => {
    const result = runCli(cwd, "init", "--target", tool);
    expect(result.status).toBe(0);
    expect(read(file)).toContain(CONTEXT_FILE_MARKER);
    expect(read(file)).toContain("Stack: nextjs (typescript)");
    expect(existsSync(join(cwd, legacy))).toBe(false);
    expect(existsSync(join(cwd, "CLAUDE.md"))).toBe(false);
    expect(read(".airules.yml")).not.toContain(`- ${tool}`);
    expect(result.stdout).toContain(`Add ${tool} to .airules.yml targets`);
    expect(runCli(cwd, "check", "--json", "--target", tool).status).toBe(0);
  });

  it.each(["", "project: { name: configured, stack: django, language: python }\n"])(
    "keeps sync, detect-sync, status and check consistent for config %s",
    (project) => {
      write(
        ".airules.yml",
        `${project}targets: [${tool}]\ncustom: [Preserve customer data privacy]\n`,
      );
      expect(runCli(cwd, "sync").status).toBe(0);
      expect(read(file)).toContain(project ? "Stack: django (python)" : "Stack: generic (other)");
      expect(read(file)).toContain("Preserve customer data privacy");
      expectClean(tool, file);
      const content = read(file);
      expect(runCli(cwd, "sync", "--detect").status).toBe(0);
      expect(read(file)).toBe(content);
      expectClean(tool, file);
      expect(runCli(cwd, "sync").stdout).not.toContain(`✔ ${file}`);
      write(file, `${content}\n- Temporary manual edit\n`);
      expect(runCli(cwd, "check", "--json", "--target", tool).status).toBe(1);
      expect(runCli(cwd, "sync", "--dry-run").status).toBe(0);
      expect(read(file)).toContain("Temporary manual edit");
      expect(runCli(cwd, "sync").status).toBe(0);
      expect(read(file)).toBe(content);
      expectClean(tool, file);
    },
  );

  it("preserves human context on init and replaces only with explicit force", () => {
    write(file, authored);
    write(legacy, legacyContent);
    expect(runCli(cwd, "init", "--target", tool, "--dry-run").status).toBe(0);
    expect(existsSync(join(cwd, ".airules.yml"))).toBe(false);
    const init = runCli(cwd, "init", "--target", tool);
    expect(init.status).toBe(0);
    expect(init.stdout).toContain(`Preserved existing ${file}`);
    expect(read(file)).toBe(authored);
    const config = read(".airules.yml");
    expect(runCli(cwd, "init", "--target", tool, "--force", "--dry-run").status).toBe(0);
    expect(read(file)).toBe(authored);
    expect(read(".airules.yml")).toBe(config);
    expect(runCli(cwd, "init", "--target", tool, "--force").status).toBe(0);
    expect(read(file)).toContain(CONTEXT_FILE_MARKER);
    expect(read(legacy)).toBe(legacyContent);
  });

  it("reports unowned drift read-only and refuses sync before changing other targets", () => {
    write(".airules.yml", `targets: [claude, ${tool}]\n`);
    write("CLAUDE.md", authored);
    write(file, authored);
    write(legacy, legacyContent);
    const config = read(".airules.yml");
    expect(runCli(cwd, "check", "--json", "--target", tool).status).toBe(1);
    expect(JSON.parse(runCli(cwd, "status", "--json").stdout).diffs).toContainEqual(
      expect.objectContaining({ file, tool, status: "modified" }),
    );
    for (const flags of [[], ["--force"]]) {
      const preview = runCli(cwd, "sync", "--dry-run", ...flags);
      expect(preview.status).toBe(0);
      if (flags.length === 0) expect(preview.stdout).toContain("A real sync will preserve it");
      expect(read(file)).toBe(authored);
      expect(read("CLAUDE.md")).toBe(authored);
    }
    const sync = runCli(cwd, "sync");
    expect(sync.status).toBe(1);
    expect(sync.stdout).toContain(`Preserved existing ${file}: not managed by airules`);
    expect(read(file)).toBe(authored);
    expect(read("CLAUDE.md")).toBe(authored);
    expect(read(".airules.yml")).toBe(config);
    expect(read(legacy)).toBe(legacyContent);
    expect(runCli(cwd, "sync", "--target", tool, "--force").status).toBe(0);
    expect(read(file)).toContain(CONTEXT_FILE_MARKER);
    expect(read("CLAUDE.md")).toBe(authored);
    expect(read(legacy)).toBe(legacyContent);
    expectClean(tool, file);
  });

  it("recognizes managed Windows line endings and preserves files with a removed or changed marker", () => {
    write(".airules.yml", `targets: [${tool}]\n`);
    expect(runCli(cwd, "sync").status).toBe(0);
    const managed = read(file);
    for (const prefix of ["", "\uFEFF"]) {
      write(file, prefix + managed.replace(/\n/g, "\r\n"));
      expect(runCli(cwd, "sync").status).toBe(0);
      expect(read(file)).toBe(managed);
    }
    for (const content of [
      managed.replace(`${CONTEXT_FILE_MARKER}\n`, ""),
      managed.replace("Generated by airules", "Maintained by the team"),
    ]) {
      write(file, content);
      expect(runCli(cwd, "sync").status).toBe(1);
      expect(read(file)).toBe(content);
    }
  });

  it("migrates without writing legacy paths and imports both paths without the marker", () => {
    write(".airules.yml", `targets: [${tool}]\n`);
    write(legacy, legacyContent);
    const missing = runCli(cwd, "check", "--json");
    expect(missing.status).toBe(1);
    expect(JSON.parse(missing.stdout).changes).toEqual([
      expect.objectContaining({ file, tool, status: "added" }),
    ]);
    expect(runCli(cwd, "sync", "--dry-run").status).toBe(0);
    expect(existsSync(join(cwd, file))).toBe(false);
    expect(runCli(cwd, "sync").status).toBe(0);
    expectClean(tool, file);
    const managed = read(file);
    const config = read(".airules.yml");
    expect(runCli(cwd, "import").status).toBe(1);
    expect(runCli(cwd, "import", "--force", "--dry-run").status).toBe(0);
    expect(read(".airules.yml")).toBe(config);
    const imported = runCli(cwd, "import", "--force");
    expect(imported.status).toBe(0);
    expect(imported.stdout).toContain(`${file} (${tool})`);
    expect(imported.stdout).toContain(`${legacy} (${tool})`);
    expect(read(".airules.yml")).toContain("Retain hand-edited migration rules.");
    expect(read(".airules.yml")).not.toContain(CONTEXT_FILE_MARKER);
    expect(read(file)).toBe(managed);
    expect(read(legacy)).toBe(legacyContent);
  });

  it.each(["symlink", "dangling symlink", "hardlink", "directory"])(
    "refuses a %s context path even when forced",
    (kind) => {
      write(".airules.yml", `targets: [${tool}]\n`);
      write("TEAM.md", authored);
      const path = join(cwd, file);
      if (kind === "symlink") symlinkSync(join(cwd, "TEAM.md"), path);
      else if (kind === "dangling symlink") symlinkSync(join(cwd, "missing.md"), path);
      else if (kind === "hardlink") linkSync(join(cwd, "TEAM.md"), path);
      else mkdirSync(path);
      for (const args of [
        ["sync"],
        ["sync", "--force"],
        ["sync", "--dry-run"],
        ["check", "--json"],
        ["status", "--json"],
        ["import", "--force"],
      ]) {
        const result = runCli(cwd, ...args);
        expect(result.stdout).toContain("regular file with a single link");
        expect(result.status).toBe(args[0] === "status" ? 0 : args[0] === "check" ? 2 : 1);
      }
      const init = runCli(cwd, "init", "--force", "--target", tool);
      expect(init.status).toBe(1);
      expect(init.stdout).toContain("regular file with a single link");
      expect(read("TEAM.md")).toBe(authored);
      expect(existsSync(join(cwd, "missing.md"))).toBe(false);
    },
  );
});

describe("legacy context import safety", () => {
  it("does not follow a symlinked legacy Gemini directory", () => {
    mkdirSync(join(cwd, "private-context"));
    write("private-context/rules.md", authored);
    symlinkSync(join(cwd, "private-context"), join(cwd, ".gemini"), "dir");
    for (const args of [["import"], ["import", "--dry-run"], ["import", "--force"]]) {
      const result = runCli(cwd, ...args);
      expect(result.status).toBe(1);
      expect(result.stdout).toContain("context directories must not be aliases");
      expect(existsSync(join(cwd, ".airules.yml"))).toBe(false);
      expect(read("private-context/rules.md")).toBe(authored);
    }
  });

  it.each(targets)("rejects an aliased $tool legacy file during import", ({ legacy }) => {
    write("TEAM.md", authored);
    mkdirSync(dirname(join(cwd, legacy)), { recursive: true });
    symlinkSync(join(cwd, "TEAM.md"), join(cwd, legacy));
    const result = runCli(cwd, "import");
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("regular file with a single link");
    expect(existsSync(join(cwd, ".airules.yml"))).toBe(false);
    expect(read("TEAM.md")).toBe(authored);
  });
});
