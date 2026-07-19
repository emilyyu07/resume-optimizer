import type { ScorerWeights } from "../config/weights";
import type { Fact } from "../models/Fact";
import type { JobPosting } from "../models/JobPosting";
import type { IScorer } from "./interfaces/IScorer";

export interface CompositeScorerDependencies {
  readonly scorers: readonly IScorer[];
  readonly weights: Readonly<Record<string, number>>;
}

/**
 * Aggregates multiple scorers through configurable weighted composition.
 */
export class CompositeScorer implements IScorer {
  // TODO: Add calibration hooks to tune score normalization by domain.
  readonly id = "composite";
  private readonly scorers: readonly IScorer[];
  private readonly weights: Readonly<Record<string, number>>;

  constructor(dependencies: CompositeScorerDependencies) {
    this.scorers = dependencies.scorers;
    this.weights = dependencies.weights;
  }

  score(fact: Fact, jobPosting: JobPosting): number {
    if (this.scorers.length === 0) {
      return 0;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (const scorer of this.scorers) {
      const weight = this.weights[scorer.id] ?? 1;
      weightedSum += scorer.score(fact, jobPosting) * weight;
      totalWeight += weight;
    }

    return totalWeight === 0 ? 0 : weightedSum / totalWeight;
  }
}

export function buildCompositeWeights(config: ScorerWeights): Readonly<Record<string, number>> {
  return {
    keyword: config.keywordWeight,
    skill: config.skillWeight,
    responsibility: config.responsibilityWeight,
    title: config.titleWeight,
    requiredQualification: config.requiredQualificationWeight,
    preferredQualification: config.preferredQualificationWeight
  };
}
