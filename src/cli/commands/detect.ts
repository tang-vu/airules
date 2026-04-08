import chalk from "chalk";
import Table from "cli-table3";
import { detectProject } from "../../core/detector/index.js";
import { error, heading } from "../ui/logger.js";
import { createSpinner } from "../ui/spinner.js";

export async function detectCommand(): Promise<void> {
  heading("🔍 airules detect");

  const spinner = createSpinner("Scanning project...");
  spinner.start();

  try {
    const profile = await detectProject(process.cwd());
    spinner.succeed("Scan complete");

    const table = new Table({
      colWidths: [20, 45],
      chars: {
        top: "─",
        "top-mid": "┬",
        "top-left": "┌",
        "top-right": "┐",
        bottom: "─",
        "bottom-mid": "┴",
        "bottom-left": "└",
        "bottom-right": "┘",
        left: "│",
        "left-mid": "├",
        mid: "─",
        "mid-mid": "┼",
        right: "│",
        "right-mid": "┤",
        middle: "│",
      },
      style: {
        head: [],
        border: [],
      },
    });

    table.push(
      [{ colSpan: 2, content: chalk.bold.cyan("            airules — Project Scan            ") }],
      ["Project", chalk.bold(profile.name)],
      ["Language", capitalize(profile.language)],
      [
        "Framework",
        profile.framework
          ? capitalize(profile.framework.replace("-", " "))
          : chalk.dim("Not detected"),
      ],
      ["Package Manager", chalk.bold(profile.packageManager)],
      ["TypeScript", profile.hasTypeScript ? chalk.green("Yes") : chalk.red("No")],
      [
        "Testing",
        profile.hasTesting ? chalk.green(profile.testingFramework ?? "Yes") : chalk.red("No"),
      ],
      ["Linter", profile.hasLinter ? chalk.green(profile.linter ?? "Yes") : chalk.red("No")],
      [
        "CSS",
        profile.hasCSSFramework ? chalk.green(profile.cssFramework ?? "Yes") : chalk.dim("None"),
      ],
      [
        "State Management",
        profile.stateManagement ? chalk.green(profile.stateManagement) : chalk.dim("None"),
      ],
      ["Monorepo", profile.isMonorepo ? chalk.yellow("Yes") : chalk.dim("No")],
      [
        "Patterns",
        profile.detectedPatterns.length > 0
          ? profile.detectedPatterns.join(", ")
          : chalk.dim("None"),
      ],
    );

    console.log("");
    console.log(table.toString());
    console.log("");
  } catch (err: unknown) {
    spinner.fail("Scan failed");
    const message = err instanceof Error ? err.message : String(err);
    error(`Failed to detect project: ${message}`);
    process.exitCode = 1;
  }
}

function capitalize(str: string): string {
  // Handle special cases
  const special: Record<string, string> = {
    typescript: "TypeScript",
    javascript: "JavaScript",
  };
  if (special[str]) return special[str];
  return str.charAt(0).toUpperCase() + str.slice(1);
}
