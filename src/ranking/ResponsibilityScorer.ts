import type { Fact } from "../models/Fact";
import type { JobPosting } from "../models/JobPosting";
import { jaccardSimilarity } from "../utils/similarity";
import { tokenize } from "../utils/tokenizer";
import type { IScorer } from "./interfaces/IScorer";

/**
 * Scores overlap with responsibility statements from job postings.
 */
export class ResponsibilityScorer implements IScorer {
  // TODO: Incorporate action-verb and impact-aware scoring.
  readonly id = "responsibility";

  score(fact: Fact, jobPosting: JobPosting): number {
    const responsibilities = tokenize(jobPosting.responsibilities.join(" "));
    const factTokens = fact.keywords.length > 0 ? fact.keywords : tokenize(fact.text);
    return jaccardSimilarity(factTokens, responsibilities);
  }
}
