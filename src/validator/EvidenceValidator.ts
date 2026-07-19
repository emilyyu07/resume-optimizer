import type { Resume } from "../models/Resume";
import { ValidationError, ValidationErrorDetail } from "./ValidationError";

interface EvidenceInfo {
  readonly sourcePath: string;
  readonly sourceSnapshot: string;
}

function normalizeSnapshot(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Ensures each referenced evidence ID maps to known candidate evidence and that
 * facts carry non-empty evidence arrays. Also verifies snapshots (normalized)
 * match between the resume fact metadata and the parser registry.
 */
export class EvidenceValidator {
  // TODO: Add richer diagnostics for missing evidence grouped by section and entry.
  validate(resume: Resume, evidenceRegistry: ReadonlyMap<string, EvidenceInfo>): void {
    const missingIds = new Map<string, Array<{ sectionId: string; entryId: string; factId: string }>>();
    const emptyEvidenceLocations: Array<{ sectionId: string; entryId: string; factId: string; factText: string }> = [];
    const mismatchedSnapshots: Array<{
      evidenceId: string;
      expected: string;
      actual: string;
      locations: Array<{ sectionId: string; entryId: string; factId: string }>;
    }> = [];

    for (const section of resume.sections) {
      for (const entry of section.entries) {
        for (const fact of entry.facts) {
          if (!Array.isArray(fact.evidenceIds) || fact.evidenceIds.length === 0) {
            emptyEvidenceLocations.push({
              sectionId: section.id,
              entryId: entry.id,
              factId: fact.id,
              factText: fact.text
            });
            continue;
          }

          for (const evidenceId of fact.evidenceIds) {
            const reg = evidenceRegistry.get(evidenceId);
            if (!reg) {
              const list = missingIds.get(evidenceId) ?? [];
              list.push({ sectionId: section.id, entryId: entry.id, factId: fact.id });
              missingIds.set(evidenceId, list);
              continue;
            }

            const expected = normalizeSnapshot(reg.sourceSnapshot);
            const actual = normalizeSnapshot(fact.metadata.sourceSnapshot ?? "");
            if (expected !== actual) {
              const existing = mismatchedSnapshots.find((m) => m.evidenceId === evidenceId);
              if (existing) {
                existing.locations.push({ sectionId: section.id, entryId: entry.id, factId: fact.id });
              } else {
                mismatchedSnapshots.push({
                  evidenceId,
                  expected,
                  actual,
                  locations: [{ sectionId: section.id, entryId: entry.id, factId: fact.id }]
                });
              }
            }
          }
        }
      }
    }

    const details: ValidationErrorDetail[] = [];

    for (const l of emptyEvidenceLocations) {
      details.push({
        code: "empty_evidence",
        message: "Fact has empty evidenceIds",
        sectionId: l.sectionId,
        entryId: l.entryId,
        factId: l.factId
      });
    }

    for (const [id, contexts] of missingIds.entries()) {
      details.push({
        code: "missing_evidence",
        message: "Evidence id referenced in resume but missing from registry",
        evidenceId: id,
        locations: contexts.map((c) => `${c.sectionId}/${c.entryId}/${c.factId}`)
      });
    }

    for (const m of mismatchedSnapshots) {
      details.push({
        code: "snapshot_mismatch",
        message: "Registry snapshot does not match resume fact snapshot",
        evidenceId: m.evidenceId,
        expected: m.expected,
        actual: m.actual,
        locations: m.locations.map((c) => `${c.sectionId}/${c.entryId}/${c.factId}`)
      });
    }

    if (details.length > 0) {
      throw new ValidationError("Evidence validation failed", details, "evidence_validation_failed");
    }
  }
}
