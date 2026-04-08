import type { ScoreContext, ScoreCriteria } from "./types.js";

export const scoringCriteria: ScoreCriteria[] = [
  {
    name: "Completeness",
    description: "Has all recommended sections",
    weight: 0.25,
    calculate: (ctx: ScoreContext): number => {
      let score = 0;
      if (ctx.hasConfig) score += 20;
      if (ctx.hasStyleRules) score += 15;
      if (ctx.hasArchitectureRules) score += 15;
      if (ctx.hasTestingRules) score += 15;
      if (ctx.hasGitRules) score += 15;
      if (ctx.hasSecurityRules) score += 20;
      return Math.min(score, 100);
    },
  },
  {
    name: "Specificity",
    description: "Rules specific to detected stack or generic",
    weight: 0.25,
    calculate: (ctx: ScoreContext): number => {
      if (!ctx.stackDetected) return 20;
      if (ctx.stackSpecificRules) return 100;
      if (ctx.hasConfig) return 60;
      return 40;
    },
  },
  {
    name: "Coverage",
    description: "How many AI tools are configured",
    weight: 0.2,
    calculate: (ctx: ScoreContext): number => {
      const total = ctx.expectedFiles.length;
      if (total === 0) return 0;
      const configured = ctx.configTargets.length;
      return Math.round((configured / Math.max(total, 1)) * 100);
    },
  },
  {
    name: "Custom Rules",
    description: "Has project-specific custom rules",
    weight: 0.15,
    calculate: (ctx: ScoreContext): number => {
      if (ctx.hasCustomRules) return 100;
      return 30;
    },
  },
  {
    name: "Security",
    description: "Has security rules defined",
    weight: 0.15,
    calculate: (ctx: ScoreContext): number => {
      if (ctx.hasSecurityRules) return 100;
      return 20;
    },
  },
];

export function calculateOverallScore(scores: number[], weights: number[]): number {
  let total = 0;
  for (let i = 0; i < scores.length; i++) {
    const score = scores[i] ?? 0;
    const weight = weights[i] ?? 0;
    total += score * weight;
  }
  return Math.round(total);
}

export function scoreToGrade(score: number): string {
  if (score >= 95) return "S";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  return "D";
}
