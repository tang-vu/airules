import type { ScoreContext } from "./types.js";

export interface Suggestion {
  message: string;
  priority: "high" | "medium" | "low";
}

export function generateSuggestions(ctx: ScoreContext): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Security suggestions
  if (!ctx.hasSecurityRules) {
    suggestions.push({
      message: "Add security rules (no_secrets_in_code, sanitize_inputs)",
      priority: "high",
    });
  }

  // Testing suggestions
  if (!ctx.hasTestingRules) {
    suggestions.push({
      message: "Define testing.framework to ensure AI writes tests",
      priority: "medium",
    });
  }

  // Custom rules suggestions
  if (!ctx.hasCustomRules) {
    suggestions.push({
      message: "Add custom rules specific to your project's patterns",
      priority: "medium",
    });
  }

  // Coverage suggestions
  const missingTools = ctx.expectedFiles.filter((file) => !ctx.generatedFiles.includes(file));
  if (missingTools.length > 0) {
    suggestions.push({
      message: `Consider adding rules for: ${missingTools.slice(0, 3).join(", ")}`,
      priority: "low",
    });
  }

  // Stack-specific suggestions
  if (ctx.stackDetected && !ctx.stackSpecificRules) {
    suggestions.push({
      message: "Add stack-specific rules for better AI-generated code",
      priority: "medium",
    });
  }

  // Git suggestions
  if (!ctx.hasGitRules) {
    suggestions.push({
      message: "Define git commit style and branch conventions",
      priority: "low",
    });
  }

  return suggestions;
}
