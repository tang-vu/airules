import { loadConfig } from "../../core/config/loader.js";
import { detectProject } from "../../core/detector/index.js";
import { diffSync, formatDiffTable, type DiffResult } from "../../core/sync/diff.js";
import { heading, info, success, warn } from "../ui/logger.js";
import { createSpinner } from "../ui/spinner.js";

interface CheckOptions {
  json?: boolean;
  target?: string;
}

export function driftChanges(diffs: DiffResult[]): DiffResult[] {
  return diffs.filter((diff) => diff.status !== "unchanged");
}

export async function checkCommand(options: CheckOptions): Promise<void> {
  try {
    const config = loadConfig(process.cwd());
    if (!config) {
      if (options.json) {
        console.log(JSON.stringify({ ok: false, error: "config-not-found", changes: [] }, null, 2));
      } else {
        warn("No .airules.yml found. Run `airules init` first.");
      }
      process.exitCode = 2;
      return;
    }

    if (!options.json) heading("airules check");
    const spinner = options.json ? null : createSpinner("Checking generated rule files...");
    spinner?.start();
    const profile = await detectProject(process.cwd());
    spinner?.stop();

    const diffs = diffSync(profile, config, process.cwd(), options.target);
    const changes = driftChanges(diffs);
    const ok = changes.length === 0;

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            ok,
            checked: diffs.length,
            changed: changes.length,
            changes,
          },
          null,
          2,
        ),
      );
    } else if (ok) {
      success("Generated AI rule files are in sync with .airules.yml.");
    } else {
      warn(`${changes.length} generated rule file${changes.length === 1 ? " is" : "s are"} out of sync.`);
      console.log(formatDiffTable(diffs));
      console.log("");
      info("Run `airules sync` and commit the generated files.");
    }

    process.exitCode = ok ? 0 : 1;
  } catch (error: unknown) {
    if (options.json) {
      console.log(
        JSON.stringify(
          {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
            changes: [],
          },
          null,
          2,
        ),
      );
    } else {
      warn(`Check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exitCode = 2;
  }
}
