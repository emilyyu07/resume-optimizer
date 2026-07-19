import type { OptimizerConfig } from "../config/weights";
import { DEFAULT_OPTIMIZER_CONFIG } from "../config/weights";
import type { Candidate } from "../models/Candidate";
import type { Fact } from "../models/Fact";
import type { JobPosting } from "../models/JobPosting";
import type { Resume } from "../models/Resume";
import type { IScorer } from "../ranking/interfaces/IScorer";
import { BulletLimiter } from "./BulletLimiter";
import { SectionOrganizer } from "./SectionOrganizer";

export interface ResumeOptimizerDependencies {
  readonly scorer: IScorer;
  readonly sectionOrganizer?: SectionOrganizer;
  readonly bulletLimiter?: BulletLimiter;
  readonly config?: OptimizerConfig;
}

export interface OptimizeInput {
  readonly candidate: Candidate;
  readonly candidateFacts: readonly Fact[];
  readonly jobPosting: JobPosting;
}

/**
 * Orchestrates baseline optimization flow: collect, score, select, and structure.
 */
export class ResumeOptimizer {
  // TODO: Add strategy plug-ins for fact selection policies and experimentation.
  private readonly scorer: IScorer;
  private readonly sectionOrganizer: SectionOrganizer;
  private readonly bulletLimiter: BulletLimiter;
  private readonly config: OptimizerConfig;

  constructor(dependencies: ResumeOptimizerDependencies) {
    this.scorer = dependencies.scorer;
    this.sectionOrganizer = dependencies.sectionOrganizer ?? new SectionOrganizer();
    this.bulletLimiter = dependencies.bulletLimiter ?? new BulletLimiter();
    this.config = dependencies.config ?? DEFAULT_OPTIMIZER_CONFIG;
  }

  optimize(input: OptimizeInput): Resume {
    const scoredFacts = this.collectAndScore(input.candidateFacts, input.jobPosting);
    const selectedFacts = this.select(scoredFacts);
    const organizedSections = this.sectionOrganizer.organize(selectedFacts);
    const sections = this.bulletLimiter.limit(organizedSections, {
      maxFactsPerEntry: this.config.maxFactsPerEntry,
      maxBulletsPerSection: this.config.maxBulletsPerSection
    });
    const totalBullets = sections.reduce(
      (sum, section) => sum + section.entries.reduce((n, entry) => n + entry.facts.length, 0),
      0
    );

    return {
      candidateId: input.candidate.id,
      jobPostingId: input.jobPosting.id,
      generatedAt: new Date().toISOString(),
      metadata: {
        pageCountEstimate: Math.max(1, Math.ceil(totalBullets / 25)),
        maxBulletsPerSection: this.config.maxBulletsPerSection,
        generatedBy: "resume-optimizer-baseline"
      },
      sections
    };
  }

  private collectAndScore(facts: readonly Fact[], jobPosting: JobPosting): readonly Fact[] {
    return facts
      .map((fact) => ({
        ...fact,
        score: this.scorer.score(fact, jobPosting)
      }))
      .sort((left, right) => right.score - left.score);
  }

  private select(scoredFacts: readonly Fact[]): readonly Fact[] {
    return scoredFacts.slice(0, this.config.maxFactsSelected);
  }
}
