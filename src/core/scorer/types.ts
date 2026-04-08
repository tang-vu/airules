export interface ScoreResult {
  completeness: number;
  specificity: number;
  coverage: number;
  customRules: number;
  security: number;
  overall: number;
  grade: string;
}

export interface ScoreCriteria {
  name: string;
  description: string;
  weight: number;
  calculate(profile: ScoreContext): number;
}

export interface ScoreContext {
  configTargets: string[];
  hasConfig: boolean;
  hasCustomRules: boolean;
  hasTestingRules: boolean;
  hasSecurityRules: boolean;
  hasStyleRules: boolean;
  hasGitRules: boolean;
  hasArchitectureRules: boolean;
  stackDetected: boolean;
  stackSpecificRules: boolean;
  generatedFiles: string[];
  expectedFiles: string[];
}
