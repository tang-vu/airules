import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { airulesConfigSchema } from "../../src/core/config/schema.js";
import { detectProject } from "../../src/core/detector/index.js";
import { generateAll } from "../../src/core/generator/index.js";
import { diffSync } from "../../src/core/sync/diff.js";

let cwd: string;
const config = airulesConfigSchema.parse({ targets: ["claude", "codex"] });

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "airules-diff-"));
});

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

describe("diffSync target scope", () => {
  it("ignores other configured and unconfigured files when a target is selected", async () => {
    const profile = await detectProject(cwd);
    generateAll(profile, config, cwd);
    const otherRules = "# Unrelated hand-written rules\n";
    writeFileSync(join(cwd, "AGENTS.md"), otherRules);
    writeFileSync(join(cwd, ".cursorrules"), otherRules);

    const diffs = diffSync(profile, config, cwd, "claude");

    expect(diffs.map(({ file, status }) => ({ file, status }))).toEqual([
      { file: "CLAUDE.md", status: "unchanged" },
    ]);
    expect(readFileSync(join(cwd, "AGENTS.md"), "utf8")).toBe(otherRules);
    expect(readFileSync(join(cwd, ".cursorrules"), "utf8")).toBe(otherRules);
    expect(diffSync(profile, config, cwd).map(({ file, status }) => ({ file, status }))).toEqual([
      { file: "CLAUDE.md", status: "unchanged" },
      { file: "AGENTS.md", status: "modified" },
    ]);
  });

  it("still reports missing and modified selected files without writing them", async () => {
    const profile = await detectProject(cwd);
    writeFileSync(join(cwd, "AGENTS.md"), "# Preserve me\n");

    expect(diffSync(profile, config, cwd, "claude")).toMatchObject([
      { file: "CLAUDE.md", status: "added" },
    ]);
    expect(existsSync(join(cwd, "CLAUDE.md"))).toBe(false);

    writeFileSync(join(cwd, "CLAUDE.md"), "outdated\n");
    expect(diffSync(profile, config, cwd, "claude")).toMatchObject([
      { file: "CLAUDE.md", status: "modified" },
    ]);
    expect(readFileSync(join(cwd, "CLAUDE.md"), "utf8")).toBe("outdated\n");
    expect(readFileSync(join(cwd, "AGENTS.md"), "utf8")).toBe("# Preserve me\n");
  });

  it("reports no changes when no outputs are configured", async () => {
    const profile = await detectProject(cwd);
    writeFileSync(join(cwd, "CLAUDE.md"), "# Preserve me\n");

    expect(diffSync(profile, { ...config, targets: [] }, cwd)).toEqual([]);
    expect(readFileSync(join(cwd, "CLAUDE.md"), "utf8")).toBe("# Preserve me\n");
  });
});
