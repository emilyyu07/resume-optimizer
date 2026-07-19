import type { Fact } from "../models/Fact";
import type { JobPosting } from "../models/JobPosting";
import { jaccardSimilarity } from "../utils/similarity";
import { tokenize } from "../utils/tokenizer";
import type { IScorer } from "./interfaces/IScorer";

/**
 * Scores facts by lexical overlap with global job keywords.
 */
export class KeywordScorer implements IScorer {
  // TODO: Replace lexical overlap with semantic embedding search.
  readonly id = "keyword";

  score(fact: Fact, jobPosting: JobPosting): number {
    const factTokens = fact.keywords.length > 0 ? fact.keywords : tokenize(fact.text);
    return jaccardSimilarity(factTokens, jobPosting.keywords);
  }
}
