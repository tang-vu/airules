import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import chalk from "chalk";
import { findConfigPath, generateConfigFromProfile, saveConfig } from "../../core/config/loader.js";
import { detectProject } from "../../core/detector/index.js";
import { type GeneratedFile, generateAll, getGeneratorInfo } from "../../core/generator/index.js";
import { error, heading, info, success, warn } from "../ui/logger.js";
import { createSpinner } from "../ui/spinner.js";

interface InitOptions {
  dryRun?: boolean;
  force?: boolean;
  target?: string;
}

export async function initCommand(options: InitOptions): Promise<void> {
  heading("🚀 airules init");

  if (options.dryRun) {
    info("Running in dry-run mode — no files will be written");
  }

  try {
    const cwd = process.cwd();
    const existingConfigPath = findConfigPath(cwd);
    if (existingConfigPath && !options.force) {
      warn(`Preserved existing ${basename(existingConfigPath)}. No files were changed.`);
      info("Run `airules sync` to update rules, or `airules init --force` to replace your setup.");
      process.exitCode = 1;
      return;
    }
    const configPath = existingConfigPath ?? join(cwd, ".airules.yml");
    const configName = basename(configPath);

    // Step 1: Detect project
    const spinner = createSpinner("Scanning project...");
    spinner.start();
    const profile = await detectProject(cwd);
    spinner.succeed(
      `Detected: ${profile.name} (${profile.language}/${profile.framework ?? "generic"})`,
    );

    // Step 2: Generate config
    const configSpinner = createSpinner(`Generating ${configName}...`);
    configSpinner.start();
    const config = generateConfigFromProfile(profile);

    if (!options.dryRun) {
      saveConfig(cwd, config, configPath);
    }
    configSpinner.succeed(`${configName} ${options.dryRun ? "would be generated" : "generated"}`);

    // Step 3: Generate target files
    const genSpinner = createSpinner("Generating AI rules for configured tools...");
    genSpinner.start();
    const results: GeneratedFile[] = [];
    const preserved: string[] = [];
    const targets = options.target ? [options.target] : config.targets;
    for (const target of targets) {
      const generator = getGeneratorInfo(target);
      if (!generator) continue;
      if (!options.force && existsSync(join(cwd, generator.outputPath))) {
        preserved.push(generator.outputPath);
        continue;
      }
      results.push(...generateAll(profile, config, cwd, options.dryRun, options.force, target));
    }
    genSpinner.succeed(
      `${results.length} file(s) ${options.dryRun ? "would be generated" : "generated"}`,
    );

    // Display summary
    console.log("");
    info(options.dryRun ? "Files to generate:" : "Generated files:");
    for (const result of results) {
      console.log(`  ${chalk.green("✔")} ${result.path} (${result.tool})`);
    }
    for (const path of preserved) {
      warn(`Preserved existing ${path}. Use --force to overwrite.`);
    }
    if (preserved.length > 0) {
      info("Run `airules import --force` to include existing rules in your config before syncing.");
    }
    console.log("");

    if (options.dryRun) {
      warn("Dry run complete. Remove --dry-run to write files.");
    } else {
      success(`Setup complete! Edit ${configName} and run \`airules sync\` to regenerate.`);
    }
  } catch (err: unknown) {
    error(`Failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  }
}
