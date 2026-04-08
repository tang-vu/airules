import type { AirulesConfig } from "../config/schema.js";
import type { ProjectProfile } from "../detector/types.js";
import { BaseGenerator } from "./base.js";

export class QwenGenerator extends BaseGenerator {
  readonly toolName = "qwen";
  readonly outputPath = ".qwenrules";
  readonly description = "Qwen Code project rules";

  generate(profile: ProjectProfile, config: AirulesConfig): string {
    const lines: string[] = [];
    lines.push(`# Qwen Code Rules for ${config.project.name}`);
    lines.push(`Stack: ${profile.framework ?? "generic"} (${profile.language})`);
    lines.push("");
    lines.push(`- Naming: ${config.rules.style.naming_convention}`);
    lines.push(`- Imports: ${config.rules.style.import_style}`);
    lines.push(`- Quotes: ${config.rules.style.quote_style}`);
    if (config.rules.style.prefer_functional)
      lines.push("- Prefer functional programming patterns");
    lines.push(`- Architecture: ${config.rules.architecture.pattern}`);
    if (config.rules.testing.framework) lines.push(`- Testing: ${config.rules.testing.framework}`);
    lines.push(`- Git: ${config.rules.git.commit_style}`);
    lines.push("");
    if (config.custom.length > 0) {
      lines.push("## Custom Rules");
      for (const rule of config.custom) lines.push(`- ${rule}`);
      lines.push("");
    }
    return this.wrapMarkdown(lines.join("\n"));
  }
}
