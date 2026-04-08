import chalk from "chalk";
import { loadConfig } from "../../core/config/loader.js";
import { detectProject } from "../../core/detector/index.js";
import { generateAll } from "../../core/generator/index.js";
import { error, heading, info, success, warn } from "../ui/logger.js";
import { createSpinner } from "../ui/spinner.js";

interface SyncOptions {
  detect?: boolean;
  dryRun?: boolean;
  force?: boolean;
  target?: string;
  watch?: boolean;
}

export async function syncCommand(options: SyncOptions): Promise<void> {
  heading("🔄 airules sync");

  if (options.dryRun) {
    info("Running in dry-run mode — no files will be written");
  }

  if (options.watch) {
    info("Watch mode not yet implemented");
    return;
  }

  try {
    // Step 1: Load config
    const config = loadConfig(process.cwd());
    if (!config) {
      error("No .airules.yml found. Run `airules init` first.");
      process.exitCode = 1;
      return;
    }

    // Step 2: Re-detect if requested
    let profile = undefined;
    if (options.detect) {
      const spinner = createSpinner("Re-detecting project...");
      spinner.start();
      profile = await detectProject(process.cwd());
      spinner.succeed("Project re-detected");
    }

    if (!profile) {
      // Generate a minimal profile from config
      profile = {
        name: config.project.name,
        language: (config.project.language as never) || "other",
        framework: (config.project.stack as never) || null,
        packageManager: "npm" as const,
        hasTypeScript: config.project.language === "typescript",
        hasTesting: false,
        testingFramework: null,
        hasLinter: false,
        linter: null,
        hasCSSFramework: false,
        cssFramework: null,
        stateManagement: null,
        isMonorepo: false,
        srcDirectory: "src",
        keyDirectories: [],
        keyFiles: [],
        dependencies: {},
        devDependencies: {},
        detectedPatterns: [],
      };
    }

    // Step 3: Re-generate
    const spinner = createSpinner("Generating AI rules...");
    spinner.start();
    const results = generateAll(
      profile,
      config,
      process.cwd(),
      options.dryRun,
      options.force,
      options.target,
    );
    spinner.succeed(`${results.length} file(s) updated`);

    console.log("");
    info("Updated files:");
    for (const result of results) {
      console.log(`  ${chalk.green("✔")} ${result.path} (${result.tool})`);
    }
    console.log("");

    if (options.dryRun) {
      warn("Dry run complete. Remove --dry-run to write files.");
    } else {
      success("Sync complete!");
    }
  } catch (err: unknown) {
    error(`Failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  }
}
