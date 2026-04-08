import type { AirulesConfig } from "../config/schema.js";
import type { ProjectProfile } from "../detector/types.js";
import { BaseGenerator } from "./base.js";

export class GeminiGenerator extends BaseGenerator {
  readonly toolName = "gemini";
  readonly outputPath = ".gemini/rules.md";
  readonly description = "Google Gemini CLI project rules";

  generate(profile: ProjectProfile, config: AirulesConfig): string {
    const lines: string[] = [];
    lines.push(`# Gemini Rules for ${config.project.name}`);
    lines.push(`Stack: ${profile.framework ?? "generic"} (${profile.language})`);
    lines.push("");
    lines.push("## Code Style");
    lines.push(`- Use ${config.rules.style.naming_convention} naming`);
    lines.push(`- Use ${config.rules.style.import_style} imports`);
    lines.push(`- Use ${config.rules.style.quote_style} quotes`);
    lines.push("");
    lines.push("## Architecture");
    lines.push(`- Pattern: ${config.rules.architecture.pattern}`);
    if (config.rules.architecture.api_style)
      lines.push(`- API Style: ${config.rules.architecture.api_style}`);
    lines.push("");
    if (config.custom.length > 0) {
      lines.push("## Custom Rules");
      for (const rule of config.custom) lines.push(`- ${rule}`);
      lines.push("");
    }
    return this.wrapMarkdown(lines.join("\n"));
  }
}
