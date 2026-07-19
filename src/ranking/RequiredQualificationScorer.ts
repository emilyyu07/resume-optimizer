import type { Fact } from "../models/Fact";
import type { JobPosting } from "../models/JobPosting";
import { tokenize } from "../utils/tokenizer";
import { TokenOverlapScorer } from "./TokenOverlapScorer";

/**
 * Scores overlap with required qualification statements.
 */
export class RequiredQualificationScorer extends TokenOverlapScorer {
	readonly id = "requiredQualification";

	protected sourceTerms(fact: Fact): readonly string[] {
		return fact.keywords.length > 0 ? fact.keywords : tokenize(fact.text);
	}

	protected targetTerms(_fact: Fact, jobPosting: JobPosting): readonly string[] {
		return jobPosting.requiredQualifications;
	}
}
