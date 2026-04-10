#!/usr/bin/env node

import { Command } from "commander";
import { checkForUpdates } from "../utils/version.js";
import { detectCommand } from "./commands/detect.js";
import { fetchCommand } from "./commands/fetch.js";
import { importCommand } from "./commands/import.js";
import { initCommand } from "./commands/init.js";
import { presetCommand } from "./commands/preset.js";
import { scoreCommand } from "./commands/score.js";
import { statusCommand } from "./commands/status.js";
import { syncCommand } from "./commands/sync.js";
import { validateCommand } from "./commands/validate.js";
import { printBanner } from "./ui/banner.js";

const VERSION = "1.4.0";

export function cli(): void {
  const program = new Command();

  // Show banner if no args
  const hasArgs = process.argv.length > 2;
  if (!hasArgs) {
    printBanner();
  }

  // Check for updates
  checkForUpdates().catch(() => {});

  program
    .name("airules")
    .description("One config to rule them all. Generate & sync AI coding rules across every tool.")
    .version(VERSION);

  program
    .command("init")
    .description("Scan project and generate AI coding rules for all configured tools")
    .option("--dry-run", "Preview changes without writing files")
    .option("--force", "Overwrite existing files without prompting")
    .option("--target <tool>", "Generate rules for a specific tool only")
    .action(initCommand);

  program
    .command("import")
    .description("Import existing .cursorrules, CLAUDE.md, etc. into .airules.yml")
    .option("--force", "Overwrite existing .airules.yml")
    .action(importCommand);

  program
    .command("fetch")
    .description("Load .airules.yml from remote URL or GitHub repo")
    .option("--output <path>", "Save config to specific path")
    .option("--merge", "Merge with local config")
    .action(fetchCommand);

  program
    .command("sync")
    .description("Re-generate all target files from .airules.yml")
    .option("--detect", "Re-detect project before generating")
    .option("--dry-run", "Preview changes without writing files")
    .option("--force", "Overwrite existing files without prompting")
    .option("--target <tool>", "Generate rules for a specific tool only")
    .option("--watch", "Watch .airules.yml for changes and auto-sync")
    .action(syncCommand);

  program
    .command("status")
    .description("Show pending changes before sync")
    .option("--json", "Output as JSON")
    .action(statusCommand);

  program
    .command("validate")
    .description("Validate .airules.yml for common mistakes and improvements")
    .option("--strict", "Fail on warnings too")
    .action(validateCommand);

  program
    .command("preset")
    .description("Browse and apply rule presets")
    .option("--list", "List available presets")
    .option("--apply <id>", "Apply a preset by ID")
    .action(presetCommand);

  program
    .command("score")
    .description("Score the quality of your AI coding rules")
    .option("--json", "Output score as JSON (for CI integration)")
    .action(scoreCommand);

  program
    .command("detect")
    .description("Detect and display project tech stack")
    .action(detectCommand);

  program.parse();
}

cli();
