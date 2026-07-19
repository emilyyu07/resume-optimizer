import { describe, expect, it } from "vitest";

import { EvidenceValidator } from "../src/validator/EvidenceValidator";
import { ResumeValidator } from "../src/validator/ResumeValidator";
import { SchemaValidator } from "../src/validator/SchemaValidator";
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
});
