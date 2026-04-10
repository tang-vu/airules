import chalk from "chalk";
import Table from "cli-table3";
import { loadConfig } from "../../core/config/loader.js";
import { detectProject } from "../../core/detector/index.js";
import { diffSync, formatDiffTable } from "../../core/sync/diff.js";
import { heading, info, success, warn } from "../ui/logger.js";
import { createSpinner } from "../ui/spinner.js";

interface StatusOptions {
  json?: boolean;
}

export async function statusCommand(options: StatusOptions): Promise<void> {
  heading("📊 airules status");

  try {
    const config = loadConfig(process.cwd());
    if (!config) {
      warn("No .airules.yml found. Run `airules init` first.");
      return;
    }

    const spinner = createSpinner("Analyzing changes...");
    spinner.start();
    const profile = await detectProject(process.cwd());
    spinner.stop();

    const diffs = diffSync(profile, config, process.cwd());

    if (options.json) {
      console.log(JSON.stringify({ config: true, diffs }, null, 2));
      return;
    }

    // Summary
    const added = diffs.filter((d) => d.status === "added").length;
    const modified = diffs.filter((d) => d.status === "modified").length;
    const unchanged = diffs.filter((d) => d.status === "unchanged").length;

    const summaryTable = new Table({
      head: [chalk.bold("Status"), chalk.bold("Count")],
      colWidths: [15, 10],
    });
    summaryTable.push(
      [chalk.green("Added"), added.toString()],
      [chalk.yellow("Modified"), modified.toString()],
      [chalk.dim("Unchanged"), unchanged.toString()],
    );

    console.log(summaryTable.toString());
    console.log("");

    if (added === 0 && modified === 0) {
      success("All files are up to date. No changes needed.");
    } else {
      info("Changes:");
      console.log(formatDiffTable(diffs));
      console.log("");
      info("Run `airules sync` to apply changes.");
    }
  } catch (err: unknown) {
    warn(`Failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
