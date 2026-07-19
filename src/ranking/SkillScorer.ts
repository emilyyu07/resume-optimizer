import type { Fact } from "../models/Fact";
import type { JobPosting } from "../models/JobPosting";
import { jaccardSimilarity } from "../utils/similarity";
import { tokenize } from "../utils/tokenizer";
import type { IScorer } from "./interfaces/IScorer";

/**
 * Scores skill alignment between fact terms and qualification text.
 */
export class SkillScorer implements IScorer {
  // TODO: Add ontology-aware skill normalization and aliases.
  readonly id = "skill";

  score(fact: Fact, jobPosting: JobPosting): number {
    const qualificationTokens = tokenize(
      [...jobPosting.requiredQualifications, ...jobPosting.preferredQualifications].join(" ")
    );
    const factTokens = fact.keywords.length > 0 ? fact.keywords : tokenize(fact.text);
    return jaccardSimilarity(factTokens, qualificationTokens);
  }
}
