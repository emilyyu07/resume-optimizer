import { describe, expect, it } from "vitest";

import { EvidenceValidator } from "../src/validator/EvidenceValidator";
import { ResumeValidator } from "../src/validator/ResumeValidator";
import { SchemaValidator } from "../src/validator/SchemaValidator";
import { resumeFixture } from "./fixtures";

describe("validators", () => {
  it("validates evidence ids", () => {
    const validator = new EvidenceValidator();
    const evidence = new Set<string>([
      "experience:exp-1:bullet:0",
      "project:proj-1:bullet:0",
      "summary:candidate-1",
      "skill:skill-1"
    ]);
    expect(() => validator.validate(resumeFixture, evidence)).not.toThrow();
  });

  it("throws for missing evidence ids", () => {
    const validator = new EvidenceValidator();
    expect(() => validator.validate(resumeFixture, new Set<string>())).toThrowError(
      /Evidence validation failed/
    );
  });

  it("validates resume shape and limits", () => {
    const resumeValidator = new ResumeValidator();
    const schemaValidator = new SchemaValidator();
    expect(() => resumeValidator.validate(resumeFixture)).not.toThrow();
    expect(() => schemaValidator.validate(resumeFixture)).not.toThrow();
  });
});
