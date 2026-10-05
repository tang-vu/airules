import type { AirulesConfig } from "../config/schema.js";
import type { ProjectProfile } from "../detector/types.js";
import { BaseGenerator } from "./base.js";
import { CONTEXT_FILE_MARKER } from "./context-file.js";

export class GeminiGenerator extends BaseGenerator {
  readonly toolName = "gemini";
  readonly outputPath = "GEMINI.md";
  readonly description = "Google Gemini CLI project rules";

  generate(_profile: ProjectProfile, config: AirulesConfig): string {
    const lines: string[] = [CONTEXT_FILE_MARKER, ""];
    lines.push(`# Gemini Rules for ${config.project.name}`);
    // The config is authoritative, so init, sync, status, and check agree.
    lines.push(
      `Stack: ${config.project.stack || "generic"} (${config.project.language || "other"})`,
    );
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
