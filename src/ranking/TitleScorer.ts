import type { Fact } from "../models/Fact";
import type { JobPosting } from "../models/JobPosting";
import { jaccardSimilarity } from "../utils/similarity";
import { tokenize } from "../utils/tokenizer";
import type { IScorer } from "./interfaces/IScorer";

/**
 * Scores title alignment between a fact's source title and job title.
 */
export class TitleScorer implements IScorer {
  // TODO: Add seniority and title taxonomy matching.
  readonly id = "title";

  score(fact: Fact, jobPosting: JobPosting): number {
    const sourceTitle =
      typeof fact.metadata.title === "string" ? fact.metadata.title : fact.text;
    return jaccardSimilarity(tokenize(sourceTitle), tokenize(jobPosting.title));
  }
}
