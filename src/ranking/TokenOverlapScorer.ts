import type { Fact } from "../models/Fact";
import type { JobPosting } from "../models/JobPosting";
import { jaccardSimilarity } from "../utils/similarity";
import { tokenize } from "../utils/tokenizer";
import type { IScorer, ScorerDiagnostics } from "./interfaces/IScorer";

function uniqueTokens(values: readonly string[]): readonly string[] {
	return [...new Set(values.flatMap((value) => tokenize(value)))];
}

function intersectTokens(sourceTokens: readonly string[], targetTokens: readonly string[]): readonly string[] {
	const target = new Set(targetTokens);
	return sourceTokens.filter((token) => target.has(token));
}

export abstract class TokenOverlapScorer implements IScorer {
	abstract readonly id: string;

	protected abstract sourceTerms(fact: Fact, jobPosting: JobPosting): readonly string[];
	protected abstract targetTerms(fact: Fact, jobPosting: JobPosting): readonly string[];

	score(fact: Fact, jobPosting: JobPosting): number {
		return jaccardSimilarity(
			uniqueTokens(this.sourceTerms(fact, jobPosting)),
			uniqueTokens(this.targetTerms(fact, jobPosting))
		);
	}

	diagnostics(fact: Fact, jobPosting: JobPosting): ScorerDiagnostics {
		const sourceTokens = uniqueTokens(this.sourceTerms(fact, jobPosting));
		const targetTokens = uniqueTokens(this.targetTerms(fact, jobPosting));

		return {
			scorerId: this.id,
			score: jaccardSimilarity(sourceTokens, targetTokens),
			details: {
				sourceTerms: sourceTokens,
				targetTerms: targetTokens,
				matchedTerms: intersectTokens(sourceTokens, targetTokens)
			}
		};
	}
}
