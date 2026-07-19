import type { Fact } from "../models/Fact";
import type { JobPosting } from "../models/JobPosting";
import { tokenize } from "../utils/tokenizer";
import { TokenOverlapScorer } from "./TokenOverlapScorer";

/**
 * Scores facts by lexical overlap with global job keywords.
 */
export class KeywordScorer extends TokenOverlapScorer {
  readonly id = "keyword";

  protected sourceTerms(fact: Fact): readonly string[] {
    return tokenize(fact.text);
  }

  protected targetTerms(_fact: Fact, jobPosting: JobPosting): readonly string[] {
    return jobPosting.keywords;
  }
}
