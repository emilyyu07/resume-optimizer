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

// Defines the data required to run a single optimization pass.
export interface OptimizeInput {
  readonly candidate: Candidate; 
  readonly candidateFacts: readonly Fact[]; 
  readonly jobPosting: JobPosting; 
}

export class ResumeOptimizer {
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

  // The main execution method that coordinates the pipeline flow.
  optimize(input: OptimizeInput): Resume {
    const scoredFacts = this.collectAndScore(input.candidateFacts, input.jobPosting); 
    const selectedFacts = this.select(scoredFacts); 
    const dedupedFacts = this.deduplicate(selectedFacts); 
    
    const organizedSections = this.sectionOrganizer.organize(dedupedFacts); 
    
    const sections = this.bulletLimiter.limit(organizedSections, { 
      maxFactsPerEntry: this.config.maxFactsPerEntry, 
      maxBulletsPerSection: this.config.maxBulletsPerSection 
    });
    
    const totalBullets = sections.reduce(
      (sum, section) => sum + section.entries.reduce((n, entry) => n + entry.facts.length, 0), // Sums up every fact in every entry in every section.
      0
    );

    // Returns the final fully constructed JSON payload 
    return {
      candidateId: input.candidate.id, 
      jobPostingId: input.jobPosting.id,
      generatedAt: "2026-07-19T00:00:00.000Z", 
      metadata: { 
        pageCountEstimate: Math.max(1, Math.ceil(totalBullets / 25)), // Estimates 25 bullets per page max.
        maxBulletsPerSection: this.config.maxBulletsPerSection, 
        generatedBy: "resume-optimizer-baseline" 
      },
      sections 
    };
  }

  // Helper method to execute the scoring engine.
  private collectAndScore(facts: readonly Fact[], jobPosting: JobPosting): readonly Fact[] {
    return facts
      .map((fact) => ({ 
        ...fact, 
        score: this.scorer.score(fact, jobPosting) 
      }))
      .sort((left, right) => right.score - left.score); 
  }

  // Helper method to slice the top performers.
  private select(scoredFacts: readonly Fact[]): readonly Fact[] {
    return scoredFacts.slice(0, this.config.maxFactsSelected); 
  }

  private deduplicate(facts: readonly Fact[]): readonly Fact[] {
    const seenSkills = new Set<string>(); // Uses a Set for O(1) string lookup time.
    
    return facts.filter(fact => { // Filters the array in place.
      if (fact.sourceType === "skill" && fact.metadata?.name) { 
        const normalized = fact.metadata.name.toString().toLowerCase().trim(); 
        if (seenSkills.has(normalized)) return false; // If we've seen this skill, return false to drop it from the array.
        seenSkills.add(normalized); // If it's new, add it to our tracking Set.
      }
      return true; 
    });
  }
}