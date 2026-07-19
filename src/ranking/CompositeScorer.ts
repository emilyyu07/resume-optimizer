import type { ScorerWeights } from "../config/weights";
import type { Fact } from "../models/Fact";
import type { JobPosting } from "../models/JobPosting";
import type { IScorer, ScorerDiagnostics } from "./interfaces/IScorer";

export interface CompositeScorerDependencies {
  readonly scorers: readonly IScorer[];
  readonly weights: Readonly<Record<string, number>>;
}

export interface ScorerContribution extends ScorerDiagnostics {
  readonly weight: number;
  readonly weightedScore: number;
}

export interface CompositeScorerDiagnostics extends ScorerDiagnostics {
  readonly details: Readonly<{
    readonly totalWeight: number;
    readonly contributions: readonly ScorerContribution[];
  }>;
}

/**
 * Aggregates multiple scorers through configurable weighted composition.
 */
export class CompositeScorer implements IScorer {
  readonly id = "composite";
  private readonly scorers: readonly IScorer[];
  private readonly weights: Readonly<Record<string, number>>;

  constructor(dependencies: CompositeScorerDependencies) {
    this.scorers = dependencies.scorers;
    this.weights = dependencies.weights;
  }

  score(fact: Fact, jobPosting: JobPosting): number {
    return this.diagnostics(fact, jobPosting).score;
  }

  diagnostics(fact: Fact, jobPosting: JobPosting): CompositeScorerDiagnostics {
    if (this.scorers.length === 0) {
      return {
        scorerId: this.id,
        score: 0,
        details: {
          totalWeight: 0,
          contributions: []
        }
      };
    }

    let weightedSum = 0;
    let totalWeight = 0;
    const contributions: ScorerContribution[] = [];

    for (const scorer of this.scorers) {
      const weight = this.weights[scorer.id] ?? 1;
      const diagnostics = scorer.diagnostics(fact, jobPosting);
      weightedSum += diagnostics.score * weight;
      totalWeight += weight;
      contributions.push({
        ...diagnostics,
        weight,
        weightedScore: diagnostics.score * weight
      });
    }

    const score = totalWeight === 0 ? 0 : weightedSum / totalWeight;

    return {
      scorerId: this.id,
      score,
      details: {
        totalWeight,
        contributions
      }
    };
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
