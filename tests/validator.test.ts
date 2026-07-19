import { describe, expect, it } from "vitest";

import { EvidenceValidator } from "../src/validator/EvidenceValidator";
import { ResumeValidator } from "../src/validator/ResumeValidator";
import { SchemaValidator } from "../src/validator/SchemaValidator";
import { ValidationError } from "../src/validator/ValidationError";
import { resumeFixture } from "./fixtures";

describe("validators", () => {
  it("validates evidence ids", () => {
    const validator = new EvidenceValidator();
    const registry = new Map<string, { sourcePath: string; sourceSnapshot: string }>();
    for (const s of resumeFixture.sections) {
      for (const e of s.entries) {
        for (const f of e.facts) {
          registry.set(f.id, { sourcePath: f.metadata.sourcePath, sourceSnapshot: f.metadata.sourceSnapshot });
        }
      }
    }
    expect(() => validator.validate(resumeFixture, registry)).not.toThrow();
  });

  it("throws for missing evidence ids", () => {
    const validator = new EvidenceValidator();
    expect(() => validator.validate(resumeFixture, new Map<string, { sourcePath: string; sourceSnapshot: string } >())).toThrowError(
      /Evidence validation failed/
    );
  });

  it("throws for facts with empty evidence arrays", () => {
    const validator = new EvidenceValidator();
    const badResume = JSON.parse(JSON.stringify(resumeFixture));
    // empty out evidence ids for first fact
    badResume.sections[0].entries[0].facts[0].evidenceIds = [];
    const registry = new Map<string, { sourcePath: string; sourceSnapshot: string }>();
    for (const s of resumeFixture.sections) {
      for (const e of s.entries) {
        for (const f of e.facts) {
          registry.set(f.id, { sourcePath: f.metadata.sourcePath, sourceSnapshot: f.metadata.sourceSnapshot });
        }
      }
    }
    expect(() => validator.validate(badResume, registry)).toThrowError(/Evidence validation failed/);
  });

  it("throws on snapshot mismatch between registry and resume facts", () => {
    const validator = new EvidenceValidator();
    const registry = new Map<string, { sourcePath: string; sourceSnapshot: string }>();
    for (const s of resumeFixture.sections) {
      for (const e of s.entries) {
        for (const f of e.facts) {
          // introduce mismatch for one id
          const snapshot = f.id === "experience:exp-1:bullet:0" ? "MISMATCHED SNAPSHOT" : f.metadata.sourceSnapshot;
          registry.set(f.id, { sourcePath: f.metadata.sourcePath, sourceSnapshot: snapshot });
        }
      }
    }

    expect(() => validator.validate(resumeFixture, registry)).toThrowError(/Evidence validation failed/);
  });

  it("validates resume shape and limits", () => {
    const resumeValidator = new ResumeValidator();
    const schemaValidator = new SchemaValidator();
    expect(() => resumeValidator.validate(resumeFixture)).not.toThrow();
    expect(() => schemaValidator.validate(resumeFixture)).not.toThrow();
  });

  it("throws structured ValidationError for resume validation failures", () => {
    const resumeValidator = new ResumeValidator();
    const invalidResume = {
      ...resumeFixture,
      sections: resumeFixture.sections.filter((section) => section.type !== "summary")
    };

    try {
      resumeValidator.validate(invalidResume);
      throw new Error("expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const validationError = error as ValidationError;
      expect(validationError.code).toBe("resume_validation_failed");
      expect(validationError.details.some((detail) => detail.code === "missing_required_sections")).toBe(true);
    }
  });

  it("throws structured ValidationError for schema failures", () => {
    const schemaValidator = new SchemaValidator();
    const invalidSchemaInput = {
      ...resumeFixture,
      candidateId: ""
    };

    try {
      schemaValidator.validate(invalidSchemaInput);
      throw new Error("expected schema validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const validationError = error as ValidationError;
      expect(validationError.code).toBe("schema_validation_failed");
      expect(validationError.details.length).toBeGreaterThan(0);
    }
  });
});
