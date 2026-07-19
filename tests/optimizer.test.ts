import { describe, expect, it } from "vitest";

import { ResumeOptimizer } from "../src/optimizer/ResumeOptimizer";
import { CompositeScorer, buildCompositeWeights } from "../src/ranking/CompositeScorer";
import { KeywordScorer } from "../src/ranking/KeywordScorer";
import { ResponsibilityScorer } from "../src/ranking/ResponsibilityScorer";
import { SkillScorer } from "../src/ranking/SkillScorer";
import { TitleScorer } from "../src/ranking/TitleScorer";
import { CandidateParser } from "../src/parser/CandidateParser";
import { DEFAULT_OPTIMIZER_CONFIG, DEFAULT_SCORER_WEIGHTS } from "../src/config/weights";
import { candidateFixture, jobPostingFixture } from "./fixtures";

describe("ResumeOptimizer", () => {
  it("runs baseline optimization pipeline", () => {
    const parsed = new CandidateParser().parse(candidateFixture);
    const scorer = new CompositeScorer({
      scorers: [new KeywordScorer(), new SkillScorer(), new ResponsibilityScorer(), new TitleScorer()],
      weights: buildCompositeWeights(DEFAULT_SCORER_WEIGHTS)
    });
    const optimizer = new ResumeOptimizer({
      scorer,
      config: DEFAULT_OPTIMIZER_CONFIG
    });

    const resume = optimizer.optimize({
      candidate: parsed.candidate,
      candidateFacts: parsed.facts,
      jobPosting: jobPostingFixture
    });

    expect(resume.jobPostingId).toBe("job-1");
    expect(resume.sections.length).toBeGreaterThan(0);
    expect(resume.metadata.pageCountEstimate).toBeGreaterThan(0);
  });
});
