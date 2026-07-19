import { describe, expect, it } from "vitest";

import { PreferredQualificationScorer } from "../src/ranking/PreferredQualificationScorer";
import { RequiredQualificationScorer } from "../src/ranking/RequiredQualificationScorer";
import { factsFixture, jobPostingFixture } from "./fixtures";

describe("QualificationScorers", () => {
	it("scores required qualifications against fact evidence", () => {
		const scorer = new RequiredQualificationScorer();

		const score = scorer.score(factsFixture[0], jobPostingFixture);
		const diagnostics = scorer.diagnostics(factsFixture[0], jobPostingFixture);

		expect(score).toBeGreaterThan(0);
		expect(diagnostics.scorerId).toBe("requiredQualification");
		expect(diagnostics.details.matchedTerms).toContain("typescript");
	});

	it("scores preferred qualifications against fact evidence", () => {
		const scorer = new PreferredQualificationScorer();

		const score = scorer.score(factsFixture[1], jobPostingFixture);
		const diagnostics = scorer.diagnostics(factsFixture[1], jobPostingFixture);

		expect(score).toBeGreaterThan(0);
		expect(diagnostics.scorerId).toBe("preferredQualification");
		expect(diagnostics.details.targetTerms).toContain("cli");
	});
});
