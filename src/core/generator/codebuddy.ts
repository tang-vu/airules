import type { AirulesConfig } from "../config/schema.js";
import type { ProjectProfile } from "../detector/types.js";
import { BaseGenerator } from "./base.js";

export class CodebuddyGenerator extends BaseGenerator {
  readonly toolName = "codebuddy";
  readonly outputPath = ".codebuddy/rules.md";
  readonly description = "CodeBuddy project rules";

  generate(profile: ProjectProfile, config: AirulesConfig): string {
    const lines: string[] = [];
    lines.push(`# CodeBuddy Rules for ${config.project.name}`);
    lines.push(`Stack: ${profile.framework ?? "generic"} (${profile.language})`);
    lines.push("");
    lines.push(`- Naming: ${config.rules.style.naming_convention}`);
    lines.push(`- Architecture: ${config.rules.architecture.pattern}`);
    if (config.custom.length > 0) {
      lines.push("## Custom Rules");
      for (const rule of config.custom) lines.push(`- ${rule}`);
      lines.push("");
    }
    return this.wrapMarkdown(lines.join("\n"));
  }
}
