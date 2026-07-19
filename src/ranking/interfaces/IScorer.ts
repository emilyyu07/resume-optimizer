import type { Fact } from "../../models/Fact";
import type { JobPosting } from "../../models/JobPosting";

export interface IScorer {
  readonly id: string;
  score(fact: Fact, jobPosting: JobPosting): number;
}
