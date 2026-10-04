import type { AirulesConfig } from "../config/schema.js";
import type { ProjectProfile } from "../detector/types.js";
import { BaseGenerator } from "./base.js";

export function assertAiderFileSafe(filePath: string): void {
  const file = lstatSync(filePath, { throwIfNoEntry: false });
  if (file && (!file.isFile() || file.nlink > 1)) {
    throw new Error(
      "Refusing to use AIDER.md: conventions must be a regular file with a single link.",
    );
  }
}

export class AiderGenerator extends BaseGenerator {
  readonly toolName = "aider";
  readonly outputPath = "AIDER.md";
  readonly description = "Aider conventions (load with aider --read AIDER.md)";

  generate(_profile: ProjectProfile, config: AirulesConfig): string {
    // Use the shared config so sync and check agree even when their detected profiles differ.
    const sections = ["# Aider Conventions"];
    const addSection = (title: string, rules: string[]): void => {
      if (rules.length === 0) return;
      sections.push(this.buildSectionHeader(title), this.buildRuleBlock(rules));
    };

    const project = [`Project: ${config.project.name}`];
    if (config.project.description) project.push(config.project.description);
    if (config.project.language) project.push(`Language: ${config.project.language}`);
    if (config.project.stack) project.push(`Stack: ${config.project.stack}`);
    if (config.project.node_version)
      project.push(`Node.js version: ${config.project.node_version}`);
    addSection("Project", project);

    const { style, architecture, testing, git, docs, security, performance } = config.rules;
    const styleRules = [
      `Naming convention: ${style.naming_convention}`,
      `Import style: ${style.import_style}`,
      `Quote style: ${style.quote_style}`,
    ];
    if (style.prefer_functional) styleRules.push("Prefer functional programming patterns");
    if (style.max_file_length !== undefined) {
      styleRules.push(`Max file length: ${style.max_file_length} lines`);
    }
    addSection("Code Style", styleRules);

    const architectureRules = [`Architecture pattern: ${architecture.pattern}`];
    if (architecture.api_style) architectureRules.push(`API style: ${architecture.api_style}`);
    if (architecture.state_management) {
      architectureRules.push(`State management: ${architecture.state_management}`);
    }
    addSection("Architecture", architectureRules);

    const testingRules = [`Test style: ${testing.style}`];
    if (testing.framework) testingRules.push(`Testing framework: ${testing.framework}`);
    if (testing.min_coverage !== undefined) {
      testingRules.push(`Minimum test coverage: ${testing.min_coverage}%`);
    }
    if (testing.require_tests_for.length > 0) {
      testingRules.push(`Require tests for: ${testing.require_tests_for.join(", ")}`);
    }
    addSection("Testing", testingRules);

    const gitRules = [`Commit style: ${git.commit_style}`, `Branch pattern: ${git.branch_pattern}`];
    if (git.require_pr) gitRules.push("Require a PR before merging");
    addSection("Git Conventions", gitRules);

    const documentationRules = [`Documentation language: ${docs.language}`];
    if (docs.require_jsdoc) documentationRules.push("Require JSDoc documentation");
    addSection("Documentation", documentationRules);

    const securityRules: string[] = [];
    if (security.no_secrets_in_code) {
      securityRules.push("Never commit secrets, API keys, or credentials");
    }
    if (security.sanitize_inputs) securityRules.push("Always sanitize and validate user inputs");
    if (security.prefer_parameterized_queries) {
      securityRules.push("Use parameterized queries to prevent SQL injection");
    }
    addSection("Security", securityRules);

    const performanceRules: string[] = [];
    if (performance.lazy_load_images) performanceRules.push("Lazy load images");
    if (performance.prefer_server_components) {
      performanceRules.push("Prefer server components");
    }
    if (performance.bundle_size_limit) {
      performanceRules.push(`Bundle size limit: ${performance.bundle_size_limit}`);
    }
    addSection("Performance", performanceRules);
    addSection("Custom Rules", config.custom);

    return this.wrapMarkdown(sections.join("\n"));
  }
}
import { lstatSync } from "node:fs";
