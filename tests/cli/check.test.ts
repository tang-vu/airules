import { describe, expect, it } from "vitest";
import { driftChanges } from "../../src/cli/commands/check.js";
import type { DiffResult } from "../../src/core/sync/diff.js";

const diff = (status: DiffResult["status"], file = "AGENTS.md"): DiffResult => ({
  file,
  tool: "codex",
  status,
  linesAdded: status === "added" || status === "modified" ? 1 : 0,
  linesRemoved: status === "deleted" || status === "modified" ? 1 : 0,
});

describe("driftChanges", () => {
  it("ignores unchanged generated files", () => {
    expect(driftChanges([diff("unchanged")])).toEqual([]);
  });

  it("treats added, modified and deleted files as drift", () => {
    const changes = driftChanges([
      diff("unchanged"),
      diff("added", "CLAUDE.md"),
      diff("modified", "AGENTS.md"),
      diff("deleted", ".cursorrules"),
    ]);
    expect(changes.map((change) => change.status)).toEqual(["added", "modified", "deleted"]);
  });
});
