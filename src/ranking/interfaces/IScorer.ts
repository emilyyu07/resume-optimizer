import type { Fact } from "../../models/Fact";
import type { JobPosting } from "../../models/JobPosting";

export interface ScorerDiagnostics {
  readonly scorerId: string;
  readonly score: number;
  readonly details: Readonly<Record<string, unknown>>;
}

export interface IScorer {
  readonly id: string;
  score(fact: Fact, jobPosting: JobPosting): number;
  diagnostics(fact: Fact, jobPosting: JobPosting): ScorerDiagnostics;
}
