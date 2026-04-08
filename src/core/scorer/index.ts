import type { AirulesConfig } from "../config/schema.js";
import type { ProjectProfile } from "../detector/types.js";
import { GENERATOR_MAP } from "../generator/types.js";
import { calculateOverallScore, scoreToGrade, scoringCriteria } from "./rules.js";
import { type Suggestion, generateSuggestions } from "./suggestions.js";
import type { ScoreContext, ScoreResult } from "./types.js";

export function scoreProject(
  profile: ProjectProfile,
  config: AirulesConfig,
  generatedFiles: string[] = [],
): { scores: ScoreResult; suggestions: Suggestion[] } {
  // Build context
  const expectedFiles = Object.values(GENERATOR_MAP);
  const ctx: ScoreContext = {
    configTargets: config.targets ?? [],
    hasConfig: true,
    hasCustomRules: config.custom.length > 0,
    hasTestingRules: Boolean(config.rules.testing.framework),
    hasSecurityRules: Object.values(config.rules.security).some(Boolean),
    hasStyleRules: Object.values(config.rules.style).some(Boolean),
    hasGitRules: Object.values(config.rules.git).some(Boolean),
    hasArchitectureRules: Object.values(config.rules.architecture).some(Boolean),
    stackDetected: profile.framework !== null,
    stackSpecificRules: profile.framework !== null && config.custom.length > 0,
    generatedFiles,
    expectedFiles,
  };

  // Calculate individual scores
  const scores: number[] = [];
  const weights: number[] = [];
  for (const criteria of scoringCriteria) {
    const score = criteria.calculate(ctx);
    scores.push(score);
    weights.push(criteria.weight);
  }

  // Calculate overall score
  const overall = calculateOverallScore(scores, weights);
  const grade = scoreToGrade(overall);

  return {
    scores: {
      completeness: scores[0] ?? 0,
      specificity: scores[1] ?? 0,
      coverage: scores[2] ?? 0,
      customRules: scores[3] ?? 0,
      security: scores[4] ?? 0,
      overall,
      grade,
    },
    suggestions: generateSuggestions(ctx),
  };
}
