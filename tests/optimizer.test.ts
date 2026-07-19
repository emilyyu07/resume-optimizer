import { describe, expect, it, beforeEach } from "vitest";

import { ResumeOptimizer } from "../src/optimizer/ResumeOptimizer";
import { CompositeScorer, buildCompositeWeights } from "../src/ranking/CompositeScorer";
import { KeywordScorer } from "../src/ranking/KeywordScorer";
import { ResponsibilityScorer } from "../src/ranking/ResponsibilityScorer";
import { SkillScorer } from "../src/ranking/SkillScorer";
import { TitleScorer } from "../src/ranking/TitleScorer";
import { CandidateParser } from "../src/parser/CandidateParser";
import { DEFAULT_OPTIMIZER_CONFIG, DEFAULT_SCORER_WEIGHTS } from "../src/config/weights";
import { candidateFixture, jobPostingFixture } from "./fixtures";
import { SectionOrganizer } from "../src/optimizer/SectionOrganizer";
import { BulletLimiter } from "../src/optimizer/BulletLimiter";
import { ResumeValidator } from "../src/validator/ResumeValidator";
import type { Fact } from "../src/models/Fact";

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

describe("Optimizer Pipeline Constraints (WEC Rules)", () => {
  let organizer: SectionOrganizer;
  let limiter: BulletLimiter;
  let validator: ResumeValidator;

  beforeEach(() => {
    organizer = new SectionOrganizer();
    limiter = new BulletLimiter();
    validator = new ResumeValidator();
  });

  it("should guarantee all WEC required sections exist even if candidate data is empty", () => {
    const emptyFacts: Fact[] = [];
    const sections = organizer.organize(emptyFacts);
    const sectionTitles = sections.map(s => s.title); // FIX: Check titles to match WEC rules

    expect(sectionTitles).toContain("Education");
    expect(sectionTitles).toContain("Experience");
    expect(sectionTitles).toContain("Skills");
    expect(sectionTitles).toContain("Personal information");
  });

  it("should strictly truncate experience entries to a maximum of 4 bullet points", () => {
    const heavyFacts: Fact[] = [
      { id: "f1", parentId: "exp1", sourceType: "experience", score: 90, evidenceIds: ["ev1"], metadata: { title: "Backend Engineer", company: "Tech Labs" } },
      { id: "f2", parentId: "exp1", sourceType: "experience", score: 85, evidenceIds: ["ev2"], metadata: { title: "Backend Engineer", company: "Tech Labs" } },
      { id: "f3", parentId: "exp1", sourceType: "experience", score: 80, evidenceIds: ["ev3"], metadata: { title: "Backend Engineer", company: "Tech Labs" } },
      { id: "f4", parentId: "exp1", sourceType: "experience", score: 75, evidenceIds: ["ev4"], metadata: { title: "Backend Engineer", company: "Tech Labs" } },
      { id: "f5", parentId: "exp1", sourceType: "experience", score: 70, evidenceIds: ["ev5"], metadata: { title: "Backend Engineer", company: "Tech Labs" } },
      { id: "f6", parentId: "exp1", sourceType: "experience", score: 65, evidenceIds: ["ev6"], metadata: { title: "Backend Engineer", company: "Tech Labs" } },
    ];

    const organized = organizer.organize(heavyFacts);
    const limited = limiter.limit(organized, { maxFactsPerEntry: 10, maxBulletsPerSection: 20 });
    const expSection = limited.find(s => s.type === "experience");
    const testEntry = expSection?.entries.find(e => e.id === "experience:exp1");

    expect(testEntry).toBeDefined();
    expect(testEntry?.facts.length).toBe(4);
  });

  it("ResumeValidator should throw a ValidationError if an experience bullet bypasses the limiter", () => {
    const invalidResume = {
      candidateId: "c1",
      jobPostingId: "j1",
      generatedAt: new Date().toISOString(),
      metadata: { pageCountEstimate: 1, maxBulletsPerSection: 20, generatedBy: "test" },
      sections: [
        { type: "education", id: "edu", title: "Education", entries: [] },
        { type: "skills", id: "skl", title: "Skills", entries: [] },
        { type: "summary", id: "pi", title: "Personal information", entries: [] }, // Disguised type
        {
          type: "experience",
          id: "exp",
          title: "Experience",
          entries: [{
            id: "exp:fail",
            title: "Test Role",
            subtitle: "Test Company",
            score: 100,
            evidenceIds: ["ev1"],
            facts: [
              { id: "f1", parentId: "fail", sourceType: "experience", score: 10, evidenceIds: ["ev1"], metadata: {} },
              { id: "f2", parentId: "fail", sourceType: "experience", score: 10, evidenceIds: ["ev2"], metadata: {} },
              { id: "f3", parentId: "fail", sourceType: "experience", score: 10, evidenceIds: ["ev3"], metadata: {} },
              { id: "f4", parentId: "fail", sourceType: "experience", score: 10, evidenceIds: ["ev4"], metadata: {} },
              { id: "f5", parentId: "fail", sourceType: "experience", score: 10, evidenceIds: ["ev5"], metadata: {} }
            ]
          }]
        }
      ]
    };

    expect(() => validator.validate(invalidResume as any)).toThrowError(/Resume validation failed/);
  });
});