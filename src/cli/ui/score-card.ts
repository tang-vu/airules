import boxen from "boxen";
import chalk from "chalk";
import type { Suggestion } from "../../core/scorer/suggestions.js";
import type { ScoreResult } from "../../core/scorer/types.js";

function progressBar(score: number, width = 20): string {
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  return colorizeBar(bar) + chalk.dim(` ${score.toString().padStart(3)}/100`);
}

function colorizeBar(bar: string): string {
  let result = "";
  for (const char of bar) {
    if (char === "█") {
      result += chalk.green(char);
    } else if (char === "░") {
      result += chalk.dim(char);
    } else {
      result += char;
    }
  }
  return result;
}

function gradeColor(grade: string): string {
  switch (grade) {
    case "S":
      return chalk.bold.green("S");
    case "A":
      return chalk.bold.green("A");
    case "B":
      return chalk.bold.yellow("B");
    case "C":
      return chalk.bold.yellow("C");
    case "D":
      return chalk.bold.red("D");
    default:
      return chalk.white(grade);
  }
}

function priorityIcon(priority: string): string {
  switch (priority) {
    case "high":
      return chalk.red("•");
    case "medium":
      return chalk.yellow("•");
    case "low":
      return chalk.blue("•");
    default:
      return "•";
  }
}

export function renderScoreCard(
  scores: ScoreResult,
  suggestions: Suggestion[],
  projectName: string,
): string {
  const lines: string[] = [];

  // Header
  lines.push(chalk.bold.cyan("              airules Score Card              "));
  lines.push(chalk.dim(`              ${projectName}              `));
  lines.push("");

  // Overall score
  const overallBar =
    "█".repeat(Math.round((scores.overall / 100) * 20)) +
    "░".repeat(20 - Math.round((scores.overall / 100) * 20));
  const coloredBar = overallBar
    .split("")
    .map((c) =>
      c === "█"
        ? scores.overall >= 70
          ? chalk.green(c)
          : scores.overall >= 50
            ? chalk.yellow(c)
            : chalk.red(c)
        : chalk.dim(c),
    )
    .join("");
  lines.push(
    `   Overall:  ${coloredBar}${chalk.dim("░".repeat(Math.max(0, 20 - overallBar.length)))}  ${chalk.bold(scores.overall.toString().padStart(3))}/100  [${gradeColor(scores.grade)}]`,
  );
  lines.push("");

  // Individual scores
  lines.push(`   Completeness   ${progressBar(scores.completeness)}`);
  lines.push(`   Specificity    ${progressBar(scores.specificity)}`);
  lines.push(`   Coverage       ${progressBar(scores.coverage)}`);
  lines.push(`   Custom Rules   ${progressBar(scores.customRules)}`);
  lines.push(`   Security       ${progressBar(scores.security)}`);
  lines.push("");

  // Suggestions
  if (suggestions.length > 0) {
    lines.push(chalk.bold("   Suggestions:"));
    for (const suggestion of suggestions) {
      lines.push(`   ${priorityIcon(suggestion.priority)} ${suggestion.message}`);
    }
  } else {
    lines.push(chalk.green("   No suggestions — looking great!"));
  }

  const content = lines.join("\n");

  return boxen(content, {
    padding: 1,
    borderColor: scores.overall >= 85 ? "green" : scores.overall >= 50 ? "yellow" : "red",
    borderStyle: "round",
    title: chalk.bold("🏆 airules Score"),
  });
}

export function renderScoreJson(
  scores: ScoreResult,
  suggestions: Suggestion[],
  projectName: string,
): string {
  return JSON.stringify(
    {
      project: projectName,
      scores,
      suggestions,
      timestamp: new Date().toISOString(),
    },
    null,
    2,
  );
}
