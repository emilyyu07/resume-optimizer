import type { Fact } from "../models/Fact";
import type { JobPosting } from "../models/JobPosting";
import { tokenize } from "../utils/tokenizer";
import { TokenOverlapScorer } from "./TokenOverlapScorer";

/**
 * Scores title alignment between a fact's source title and job title.
 */
export class TitleScorer extends TokenOverlapScorer {
  readonly id = "title";

  protected sourceTerms(fact: Fact): readonly string[] {
    const sourceTitle =
      typeof fact.metadata.title === "string" ? fact.metadata.title : fact.text;
    return tokenize(sourceTitle);
  }

  protected targetTerms(_fact: Fact, jobPosting: JobPosting): readonly string[] {
    return tokenize(jobPosting.title);
  }
}
