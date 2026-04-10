import chalk from "chalk";
import Table from "cli-table3";
import { loadConfig, saveConfig } from "../../core/config/loader.js";
import { generateConfigFromProfile } from "../../core/config/loader.js";
import { detectProject } from "../../core/detector/index.js";
import { getPreset, listPresets } from "../../core/templates/presets.js";
import { error, heading, info } from "../ui/logger.js";
import { createSpinner } from "../ui/spinner.js";

interface PresetOptions {
  list?: boolean;
  apply?: string;
}

export async function presetCommand(options: PresetOptions): Promise<void> {
  heading("📋 airules preset");

  if (options.list || !options.apply) {
    const presets = listPresets();
    const table = new Table({
      head: [chalk.bold("ID"), chalk.bold("Name"), chalk.bold("Description")],
      colWidths: [20, 20, 50],
    });
    for (const p of presets) {
      table.push([p.id, chalk.bold(p.name), p.description]);
    }
    console.log(table.toString());
    console.log("");
    info("Usage: airules preset --apply <id>");
    console.log("");
    return;
  }

  if (options.apply) {
    const preset = getPreset(options.apply);
    if (!preset) {
      error(
        `Preset "${options.apply}" not found. Run "airules preset --list" for available presets.`,
      );
      process.exitCode = 1;
      return;
    }

    const spinner = createSpinner(`Applying preset: ${preset.name}...`);
    spinner.start();

    // Load existing config or create new
    let config = loadConfig(process.cwd());
    if (!config) {
      const profile = await detectProject(process.cwd());
      config = generateConfigFromProfile(profile);
    }

    // Merge preset rules
    if (preset.config.rules) {
      config.rules = {
        ...config.rules,
        ...preset.config.rules,
      };
    }
    if (preset.config.custom) {
      config.custom = [...new Set([...config.custom, ...preset.config.custom])];
    }

    saveConfig(process.cwd(), config);
    spinner.succeed(`Applied preset: ${preset.name}`);

    console.log("");
    info(`Added ${preset.config.custom?.length ?? 0} custom rules`);
    info("Run `airules sync` to regenerate output files");
    console.log("");
  }
}
