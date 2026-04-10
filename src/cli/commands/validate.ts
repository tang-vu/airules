import chalk from "chalk";
import { loadConfig } from "../../core/config/loader.js";
import { airulesConfigSchema } from "../../core/config/schema.js";
import { error, heading, info, success } from "../ui/logger.js";

interface ValidateOptions {
  strict?: boolean;
}

interface ValidationIssue {
  type: "error" | "warning" | "info";
  message: string;
}

export async function validateCommand(options: ValidateOptions): Promise<void> {
  heading("✅ airules validate");

  const config = loadConfig(process.cwd());
  if (!config) {
    error("No .airules.yml found. Run `airules init` first.");
    process.exitCode = 1;
    return;
  }

  const issues: ValidationIssue[] = [];

  // Validate schema
  try {
    airulesConfigSchema.parse(config);
  } catch {
    issues.push({ type: "error", message: "Invalid .airules.yml schema" });
  }

  // Check targets
  if (!config.targets || config.targets.length === 0) {
    issues.push({ type: "error", message: "No targets defined — add at least one tool" });
  } else if (config.targets.length === 1) {
    issues.push({ type: "info", message: "Only 1 target — consider adding more for consistency" });
  }

  // Check custom rules
  if (config.custom.length === 0) {
    issues.push({
      type: "warning",
      message: "No custom rules — add project-specific rules for better AI output",
    });
  }

  // Check testing config
  if (!config.rules.testing.framework) {
    issues.push({
      type: "warning",
      message: "No testing.framework defined — AI won't know which test framework to use",
    });
  }

  // Check security
  if (
    !config.rules.security.sanitize_inputs &&
    !config.rules.security.prefer_parameterized_queries
  ) {
    issues.push({
      type: "info",
      message: "Consider enabling security rules (sanitize_inputs, prefer_parameterized_queries)",
    });
  }

  // Check stack-specific rules
  if (!config.project.stack && !config.project.language) {
    issues.push({
      type: "warning",
      message: "No stack or language defined — rules will be generic",
    });
  }

  // Check exclude paths
  if (
    config.exclude.includes("node_modules") &&
    config.exclude.includes("dist") &&
    config.exclude.includes("coverage")
  ) {
    // Good defaults
  } else {
    issues.push({ type: "info", message: "Consider excluding: node_modules, dist, coverage" });
  }

  // Check for overly long custom rules
  const longRules = config.custom.filter((r) => r.length > 200);
  if (longRules.length > 0) {
    issues.push({
      type: "warning",
      message: `${longRules.length} custom rule(s) exceed 200 chars — keep rules concise`,
    });
  }

  // Display results
  const errors = issues.filter((i) => i.type === "error");
  const warnings = issues.filter((i) => i.type === "warning");
  const infos = issues.filter((i) => i.type === "info");

  if (errors.length === 0 && warnings.length === 0) {
    success("No issues found — .airules.yml looks good!");
  } else {
    if (errors.length > 0) {
      console.log(chalk.red.bold("\n  Errors:"));
      for (const e of errors) console.log(chalk.red(`    ✖ ${e.message}`));
    }
    if (warnings.length > 0) {
      console.log(chalk.yellow.bold("\n  Warnings:"));
      for (const w of warnings) console.log(chalk.yellow(`    ⚠ ${w.message}`));
    }
  }

  if (infos.length > 0) {
    console.log(chalk.blue.bold("\n  Suggestions:"));
    for (const i of infos) console.log(chalk.blue(`    ℹ ${i.message}`));
  }

  console.log("");
  info(
    `${config.targets?.length ?? 0} targets · ${config.custom.length} custom rules · v${config.version}`,
  );
  console.log("");

  // Exit code
  if (errors.length > 0 || (options.strict && warnings.length > 0)) {
    process.exitCode = 1;
  }
}
