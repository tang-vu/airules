import chalk from "chalk";
import { loadRemoteConfig } from "../../core/config/remote.js";
import { detectProject } from "../../core/detector/index.js";
import { generateAll } from "../../core/generator/index.js";
import { error, heading, info, success, warn } from "../ui/logger.js";
import { createSpinner } from "../ui/spinner.js";

interface FetchOptions {
  output?: string;
  merge?: boolean;
}

export async function fetchCommand(_options: FetchOptions): Promise<void> {
  heading("🌐 airules fetch");

  const source = process.argv[4];
  if (!source) {
    warn("No source specified.");
    info("Usage:");
    console.log("  airules fetch user/repo          # Load from GitHub (main branch)");
    console.log("  airules fetch user/repo/.airules.prod.yml  # Specific path");
    console.log("  airules fetch https://example.com/rules.yml  # Direct URL");
    console.log("");
    info("Example: airules fetch mycompany/airules-config");
    return;
  }

  try {
    const spinner = createSpinner(`Fetching config from ${source}...`);
    spinner.start();

    const config = await loadRemoteConfig(source);
    spinner.succeed("Remote config loaded");

    // Detect project
    const detectSpinner = createSpinner("Detecting project...");
    detectSpinner.start();
    const profile = await detectProject(process.cwd());
    detectSpinner.succeed(`Detected: ${profile.name}`);

    // Generate
    const genSpinner = createSpinner("Generating AI rules...");
    genSpinner.start();
    const results = generateAll(profile, config, process.cwd(), false, true);
    genSpinner.succeed(`${results.length} file(s) generated`);

    console.log("");
    info(`Remote config from: ${chalk.bold(source)}`);
    info(`Targets: ${config.targets.join(", ")}`);
    info("Updated files:");
    for (const result of results) {
      console.log(`  ${chalk.green("✔")} ${result.path} (${result.tool})`);
    }
    console.log("");
    success("Fetch complete!");
  } catch (err: unknown) {
    error(`Failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  }
}
