import { describe, expect, it, beforeEach } from "vitest";

// Original imports preserved to ensure baseline tests still function
import { ResumeOptimizer } from "../src/optimizer/ResumeOptimizer";
import { CompositeScorer, buildCompositeWeights } from "../src/ranking/CompositeScorer";
import { KeywordScorer } from "../src/ranking/KeywordScorer";
import { ResponsibilityScorer } from "../src/ranking/ResponsibilityScorer";
import { SkillScorer } from "../src/ranking/SkillScorer";
import { TitleScorer } from "../src/ranking/TitleScorer";
import { CandidateParser } from "../src/parser/CandidateParser";
import { DEFAULT_OPTIMIZER_CONFIG, DEFAULT_SCORER_WEIGHTS } from "../src/config/weights";
import { candidateFixture, jobPostingFixture } from "./fixtures";

// NEW: Imports for the pipeline components we just upgraded[cite: 2]
import { SectionOrganizer } from "../src/optimizer/SectionOrganizer";
import { BulletLimiter } from "../src/optimizer/BulletLimiter";
import { ResumeValidator } from "../src/validator/ResumeValidator";
import type { Fact } from "../src/models/Fact";

describe("ResumeOptimizer", () => {
  // PREVIOUS WORK: Your teammate's baseline integration test remains untouched.
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

// NEW: Test suite dedicated to ensuring our WEC safeguards work under pressure.
describe("Optimizer Pipeline Constraints (WEC Rules)", () => {
  // Declare component variables for use across all tests in this suite.
  let organizer: SectionOrganizer;
  let limiter: BulletLimiter;
  let validator: ResumeValidator;

  // Re-instantiate fresh, clean objects before each test runs to prevent data bleed.
  beforeEach(() => {
    organizer = new SectionOrganizer();
    limiter = new BulletLimiter();
    validator = new ResumeValidator();
  });

  // TEST 1: Asserts that our pipeline initializes mandatory WEC sections[cite: 1].
  it("should guarantee all WEC required sections exist even if candidate data is empty", () => {
    const emptyFacts: Fact[] = []; // Simulates a candidate with absolutely no data.
    const sections = organizer.organize(emptyFacts); // Runs the empty data through our organizer.
    const sectionTypes = sections.map(s => s.type); // Extracts just the section names into an array.

    // Checks that the array contains every section the WEC rubric demands[cite: 1].
    expect(sectionTypes).toContain("education");
    expect(sectionTypes).toContain("experience");
    expect(sectionTypes).toContain("skills");
    expect(sectionTypes).toContain("personal_info");
  });

  // TEST 2: Asserts that our guillotine logic successfully caps bullet points[cite: 1].
  it("should strictly truncate experience entries to a maximum of 4 bullet points", () => {
    // Simulates an applicant with 6 highly scored facts under a single job entry.
    const heavyFacts: Fact[] = [
      { id: "f1", parentId: "exp1", sourceType: "experience", score: 90, evidenceIds: ["ev1"], metadata: { title: "Backend Engineer", company: "Tech Labs" } },
      { id: "f2", parentId: "exp1", sourceType: "experience", score: 85, evidenceIds: ["ev2"], metadata: { title: "Backend Engineer", company: "Tech Labs" } },
      { id: "f3", parentId: "exp1", sourceType: "experience", score: 80, evidenceIds: ["ev3"], metadata: { title: "Backend Engineer", company: "Tech Labs" } },
      { id: "f4", parentId: "exp1", sourceType: "experience", score: 75, evidenceIds: ["ev4"], metadata: { title: "Backend Engineer", company: "Tech Labs" } },
      { id: "f5", parentId: "exp1", sourceType: "experience", score: 70, evidenceIds: ["ev5"], metadata: { title: "Backend Engineer", company: "Tech Labs" } }, // This should be dropped.
      { id: "f6", parentId: "exp1", sourceType: "experience", score: 65, evidenceIds: ["ev6"], metadata: { title: "Backend Engineer", company: "Tech Labs" } }, // This should be dropped.
    ];

    const organized = organizer.organize(heavyFacts); // Groups the 6 facts into one entry.
    
    // Runs the limiter with arbitrarily high config limits to prove the hardcoded WEC limit overrides it.
    const limited = limiter.limit(organized, { maxFactsPerEntry: 10, maxBulletsPerSection: 20 });
    
    // Retrieves the processed experience section.
    const expSection = limited.find(s => s.type === "experience");
    // Retrieves the specific job entry we just processed.
    const testEntry = expSection?.entries.find(e => e.id === "experience:exp1");

    // Asserts the entry exists.
    expect(testEntry).toBeDefined();
    // Asserts the length is exactly 4, proving our limiter prevents the -10 point penalty[cite: 1].
    expect(testEntry?.facts.length).toBe(4); 
  });

  // TEST 3: Asserts the Validator acts as a secure firewall against illegal JSON outputs[cite: 1].
  it("ResumeValidator should throw a ValidationError if an experience bullet bypasses the limiter", () => {
    // Creates a mock JSON payload that deliberately breaks the rules (5 bullets in one experience).
    const invalidResume = {
      candidateId: "c1",
      jobPostingId: "j1",
      generatedAt: new Date().toISOString(),
      metadata: { pageCountEstimate: 1, maxBulletsPerSection: 20, generatedBy: "test" },
      sections: [
        { type: "education", id: "edu", title: "Education", entries: [] },
        { type: "skills", id: "skl", title: "Skills", entries: [] },
        { type: "personal_info", id: "pi", title: "Personal information", entries: [] },
        {
          type: "experience", // The problematic section
          id: "exp",
          title: "Experience",
          entries: [{
            id: "exp:fail",
            title: "Test Role",
            subtitle: "Test Company",
            score: 100,
            evidenceIds: ["ev1"],
            facts: [ // 5 facts provided below
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

    // Expects the validation method to intercept the 5 bullets and throw an error containing "Resume validation failed".
    // We cast to 'any' to bypass strict TS typing for this intentionally malformed mock object.
    expect(() => validator.validate(invalidResume as any)).toThrowError(/Resume validation failed/);
  });
});