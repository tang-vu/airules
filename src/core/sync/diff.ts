import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { AirulesConfig } from "../config/schema.js";
import type { ProjectProfile } from "../detector/types.js";
import { generateAll } from "../generator/index.js";

export interface DiffResult {
  file: string;
  tool: string;
  status: "added" | "modified" | "unchanged" | "deleted";
  linesAdded: number;
  linesRemoved: number;
}

export function diffSync(
  profile: ProjectProfile,
  config: AirulesConfig,
  cwd: string,
  targetTool?: string,
): DiffResult[] {
  // Compare only outputs sync would write; other rule files are left untouched.
  const generated = generateAll(profile, config, cwd, true, true, targetTool);
  const results: DiffResult[] = [];

  for (const file of generated) {
    const fullPath = join(cwd, file.path);
    if (!existsSync(fullPath)) {
      results.push({
        file: file.path,
        tool: file.tool,
        status: "added",
        linesAdded: file.content.split("\n").length,
        linesRemoved: 0,
      });
    } else {
      const existing = readFileSync(fullPath, "utf-8");
      if (existing === file.content) {
        results.push({
          file: file.path,
          tool: file.tool,
          status: "unchanged",
          linesAdded: 0,
          linesRemoved: 0,
        });
      } else {
        const existingLines = existing.split("\n").length;
        const newLines = file.content.split("\n").length;
        results.push({
          file: file.path,
          tool: file.tool,
          status: "modified",
          linesAdded: Math.max(0, newLines - existingLines),
          linesRemoved: Math.max(0, existingLines - newLines),
        });
      }
    }
  }

  return results;
}

export function formatDiffTable(diffs: DiffResult[]): string {
  const lines: string[] = [];
  let hasChanges = false;

  for (const d of diffs) {
    if (d.status === "unchanged") continue;
    hasChanges = true;

    const icon = d.status === "added" ? "+" : d.status === "modified" ? "~" : "-";

    const changeInfo =
      d.status === "added"
        ? `+${d.linesAdded} lines`
        : d.status === "modified"
          ? `+${d.linesAdded} -${d.linesRemoved}`
          : `-${d.linesRemoved} lines`;

    lines.push(`  ${icon} ${d.file} (${changeInfo})`);
  }

  if (!hasChanges) {
    return "  No changes — all files are up to date.";
  }

  return lines.join("\n");
}
