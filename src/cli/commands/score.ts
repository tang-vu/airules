import { loadConfig } from "../../core/config/loader.js";
import { detectProject } from "../../core/detector/index.js";
import { scoreProject } from "../../core/scorer/index.js";
import { error, heading } from "../ui/logger.js";
import { renderScoreCard, renderScoreJson } from "../ui/score-card.js";
import { createSpinner } from "../ui/spinner.js";

interface ScoreOptions {
  json?: boolean;
}

export async function scoreCommand(options: ScoreOptions): Promise<void> {
  heading("🏆 airules score");

  try {
    // Step 1: Load config
    const config = loadConfig(process.cwd());
    if (!config) {
      error("No .airules.yml found. Run `airules init` first.");
      process.exitCode = 1;
      return;
    }

    // Step 2: Detect project
    const spinner = createSpinner("Analyzing project...");
    spinner.start();
    const profile = await detectProject(process.cwd());
    spinner.succeed("Analysis complete");

    // Step 3: Score
    const { scores, suggestions } = scoreProject(profile, config);

    // Step 4: Display
    if (options.json) {
      console.log(renderScoreJson(scores, suggestions, profile.name));
    } else {
      console.log("");
      console.log(renderScoreCard(scores, suggestions, profile.name));
      console.log("");
    }
  } catch (err: unknown) {
    error(`Failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  }
}
