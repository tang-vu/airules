import chalk from "chalk";
import { generateConfigFromProfile, saveConfig } from "../../core/config/loader.js";
import { detectProject } from "../../core/detector/index.js";
import { importExistingConfigs } from "../../core/importer/index.js";
import { error, heading, info, success, warn } from "../ui/logger.js";
import { createSpinner } from "../ui/spinner.js";

interface ImportOptions {
  force?: boolean;
}

export async function importCommand(options: ImportOptions): Promise<void> {
  heading("📥 airules import");

  try {
    // Step 1: Find existing configs
    const spinner = createSpinner("Scanning for existing AI rule files...");
    spinner.start();
    const result = importExistingConfigs(process.cwd());
    spinner.stop();

    if (result.sources.length === 0) {
      warn("No existing AI rule files found.");
      info(
        "Supported files: CLAUDE.md, .cursorrules, .github/copilot-instructions.md, .windsurfrules, .clinerules, AGENTS.md",
      );
      info("Run `airules init` instead to generate from scratch.");
      return;
    }

    info(`Found ${result.sources.length} existing file(s):`);
    for (const source of result.sources) {
      console.log(`  ${chalk.green("✔")} ${source.file} (${source.tool})`);
    }
    console.log("");

    info(`Extracted ${result.extractedRules.length} rule(s) from existing files`);
    if (result.detectedStack) {
      info(`Detected stack: ${chalk.bold(result.detectedStack)}`);
    }
    console.log("");

    // Step 2: Detect project profile
    const detectSpinner = createSpinner("Detecting project stack...");
    detectSpinner.start();
    const profile = await detectProject(process.cwd());
    detectSpinner.succeed(
      `Detected: ${profile.name} (${profile.language}/${profile.framework ?? "generic"})`,
    );

    // Step 3: Generate config with imported rules
    const configSpinner = createSpinner("Generating .airules.yml with imported rules...");
    configSpinner.start();
    const config = generateConfigFromProfile(profile);
    // Merge imported rules
    config.custom = [...new Set([...config.custom, ...result.extractedRules])];
    configSpinner.succeed(".airules.yml generated with imported rules");

    // Step 4: Save
    if (!options.force) {
      info("Run with --force to overwrite existing .airules.yml");
    }
    saveConfig(process.cwd(), config);
    success("Import complete!");

    console.log("");
    info("Next steps:");
    console.log(`  ${chalk.dim("1.")} Review .airules.yml and edit imported rules as needed`);
    console.log(`  ${chalk.dim("2.")} Run ${chalk.bold("airules sync")} to generate output files`);
    console.log(`  ${chalk.dim("3.")} Run ${chalk.bold("airules score")} to check quality`);
    console.log("");
  } catch (err: unknown) {
    error(`Failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  }
}
