export interface ScorerWeights {
  readonly keywordWeight: number;
  readonly requiredQualificationWeight: number;
  readonly preferredQualificationWeight: number;
  readonly responsibilityWeight: number;
  readonly titleWeight: number;
  readonly skillWeight: number;
}

export const DEFAULT_SCORER_WEIGHTS: ScorerWeights = {
  keywordWeight: 1.0,
  requiredQualificationWeight: 1.0,
  preferredQualificationWeight: 0.7,
  responsibilityWeight: 0.9,
  titleWeight: 0.8,
  skillWeight: 0.8
};

export interface OptimizerConfig {
  readonly maxFactsSelected: number;
  readonly maxFactsPerEntry: number;
  readonly maxBulletsPerSection: number;
  readonly maxPageCount: number;
  readonly requiredSections: readonly string[];
}

export const DEFAULT_OPTIMIZER_CONFIG: OptimizerConfig = {
  maxFactsSelected: 24,
  maxFactsPerEntry: 4,
  maxBulletsPerSection: 8,
  maxPageCount: 2,
  requiredSections: ["summary", "experience", "skills"]
};
