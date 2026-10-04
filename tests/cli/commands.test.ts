import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { importCommand } from "../../src/cli/commands/import.js";
import { initCommand } from "../../src/cli/commands/init.js";
import { syncCommand } from "../../src/cli/commands/sync.js";
import { loadConfig } from "../../src/core/config/loader.js";

vi.mock("../../src/cli/ui/spinner.js", () => ({
  createSpinner: () => ({ start: vi.fn(), stop: vi.fn(), succeed: vi.fn() }),
}));

const configNames = [".airules.yml", ".airules.yaml"];
const customConfig =
  "# Keep this comment\nproject:\n  name: custom-project\ncustom:\n  - Keep my rule\n";
const existingRule = "# Team rules\n- Preserve hand-written instructions exactly.\n";

let cwd: string;
let originalExitCode: typeof process.exitCode;

function read(file: string): string {
  return readFileSync(join(cwd, file), "utf-8");
}

function write(file: string, content: string): void {
  writeFileSync(join(cwd, file), content);
}

function output(): string {
  return vi
    .mocked(console.log)
    .mock.calls.map((args) => args.join(" "))
    .join("\n");
}

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "airules-cli-"));
  originalExitCode = process.exitCode;
  process.exitCode = undefined;
  vi.spyOn(process, "cwd").mockReturnValue(cwd);
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = originalExitCode;
  rmSync(cwd, { recursive: true, force: true });
});

describe.each([
  { command: "init", run: initCommand },
  { command: "import", run: importCommand },
])("$command config preservation", ({ command, run }) => {
  it.each(configNames)("refuses to overwrite %s, including its comments", async (configName) => {
    write(configName, customConfig);
    write("CLAUDE.md", existingRule);

    await run({});

    expect(read(configName)).toBe(customConfig);
    expect(read("CLAUDE.md")).toBe(existingRule);
    expect(existsSync(join(cwd, ".cursorrules"))).toBe(false);
    if (configName.endsWith(".yaml")) {
      expect(existsSync(join(cwd, ".airules.yml"))).toBe(false);
    }
    expect(process.exitCode).toBe(1);
    expect(output()).toContain(`Preserved existing ${configName}`);
    expect(output()).toContain(`airules ${command} --force`);
    expect(output()).not.toContain("complete!");
  });

  it.each(configNames)("preserves invalid %s without trying to replace it", async (configName) => {
    const invalidConfig = "project: [unfinished\n";
    write(configName, invalidConfig);
    write("CLAUDE.md", existingRule);

    await run({});

    expect(read(configName)).toBe(invalidConfig);
    expect(read("CLAUDE.md")).toBe(existingRule);
    expect(process.exitCode).toBe(1);
    expect(output()).toContain(`Preserved existing ${configName}`);
  });

  it.each(configNames)("replaces %s in place only with force", async (configName) => {
    write(configName, "project: [unfinished\n");
    write("CLAUDE.md", existingRule);

    await run({ force: true });

    expect(loadConfig(cwd)).not.toBeNull();
    expect(read(configName)).not.toContain("unfinished");
    if (configName.endsWith(".yaml")) {
      expect(existsSync(join(cwd, ".airules.yml"))).toBe(false);
    }
    expect(process.exitCode).toBeUndefined();
  });

  it("uses .yml precedence when both config aliases exist", async () => {
    write(".airules.yml", customConfig);
    write(".airules.yaml", "# Alternate config must stay intact\n");
    write("CLAUDE.md", existingRule);

    await run({ force: true });

    expect(read(".airules.yml")).not.toBe(customConfig);
    expect(read(".airules.yaml")).toBe("# Alternate config must stay intact\n");
    expect(process.exitCode).toBeUndefined();
  });

  it.each(configNames)("dry-run never overwrites %s, even with force", async (configName) => {
    write(configName, customConfig);
    write("CLAUDE.md", existingRule);

    await run({ force: true, dryRun: true });

    expect(read(configName)).toBe(customConfig);
    expect(read("CLAUDE.md")).toBe(existingRule);
    expect(existsSync(join(cwd, ".cursorrules"))).toBe(false);
    expect(existsSync(join(cwd, ".github"))).toBe(false);
    if (configName.endsWith(".yaml")) {
      expect(existsSync(join(cwd, ".airules.yml"))).toBe(false);
    }
    expect(process.exitCode).toBeUndefined();
    expect(output()).toContain("Dry run complete");
    expect(output()).not.toContain("complete!");
  });

  it("dry-run creates no config or output directories", async () => {
    write("CLAUDE.md", existingRule);

    await run({ dryRun: true });

    expect(existsSync(join(cwd, ".airules.yml"))).toBe(false);
    expect(existsSync(join(cwd, ".cursorrules"))).toBe(false);
    expect(existsSync(join(cwd, ".github"))).toBe(false);
    expect(read("CLAUDE.md")).toBe(existingRule);
    expect(output()).toContain("Dry run complete");
  });
});

describe("init rule preservation", () => {
  it("preserves existing rules and generates the missing targets", async () => {
    write("CLAUDE.md", existingRule);
    mkdirSync(join(cwd, ".github"));
    write(".github/copilot-instructions.md", existingRule);

    await initCommand({});

    expect(loadConfig(cwd)).not.toBeNull();
    expect(read("CLAUDE.md")).toBe(existingRule);
    expect(read(".github/copilot-instructions.md")).toBe(existingRule);
    expect(read(".cursorrules")).toContain("Cursor Rules");
    expect(output()).toContain("Preserved existing CLAUDE.md");
    expect(output()).toContain("Preserved existing .github/copilot-instructions.md");
    expect(process.exitCode).toBeUndefined();
  });

  it("preserves a selected existing target without generating other tools", async () => {
    write("CLAUDE.md", existingRule);

    await initCommand({ target: "claude" });

    expect(read("CLAUDE.md")).toBe(existingRule);
    expect(existsSync(join(cwd, ".cursorrules"))).toBe(false);
    expect(existsSync(join(cwd, ".github"))).toBe(false);
    expect(output()).toContain("Preserved existing CLAUDE.md");
  });

  it("force replaces only selected rule files", async () => {
    write("CLAUDE.md", existingRule);
    write(".cursorrules", existingRule);

    await initCommand({ force: true, target: "claude" });

    expect(read("CLAUDE.md")).toContain("# Project:");
    expect(read("CLAUDE.md")).not.toBe(existingRule);
    expect(read(".cursorrules")).toBe(existingRule);
    expect(existsSync(join(cwd, ".github"))).toBe(false);
  });

  it("dry-run reports preserved rules", async () => {
    write("CLAUDE.md", existingRule);

    await initCommand({ dryRun: true });

    expect(read("CLAUDE.md")).toBe(existingRule);
    expect(output()).toContain("Preserved existing CLAUDE.md");
    expect(output()).toContain("Files to generate:");
  });
});

describe("import", () => {
  it("creates a config from existing rules without changing the source files", async () => {
    write("CLAUDE.md", existingRule);

    await importCommand({});

    expect(loadConfig(cwd)?.custom).toContain("Preserve hand-written instructions exactly.");
    expect(read("CLAUDE.md")).toBe(existingRule);
    expect(process.exitCode).toBeUndefined();
    expect(output()).not.toContain("Run with --force");
  });

  it("leaves an existing config alone when there is nothing to import, even with force", async () => {
    write(".airules.yaml", customConfig);

    await importCommand({ force: true });

    expect(read(".airules.yaml")).toBe(customConfig);
    expect(existsSync(join(cwd, ".airules.yml"))).toBe(false);
    expect(output()).toContain("No existing AI rule files found");
  });
});

describe("sync", () => {
  it.each(configNames)(
    "still updates existing rules after editing %s without force",
    async (configName) => {
      write(configName, customConfig);
      write("CLAUDE.md", existingRule);

      await syncCommand({ target: "claude" });

      expect(read("CLAUDE.md")).toContain("Keep my rule");
      expect(read("CLAUDE.md")).toContain("custom-project");
      expect(read("CLAUDE.md")).not.toBe(existingRule);
      expect(read(configName)).toBe(customConfig);
      expect(process.exitCode).toBeUndefined();
    },
  );
});
