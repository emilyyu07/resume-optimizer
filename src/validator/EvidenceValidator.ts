import type { Resume } from "../models/Resume";

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

    const errors: string[] = [];
    if (emptyEvidenceLocations.length > 0) {
      errors.push(
        `Facts with empty evidenceIds found:\n${emptyEvidenceLocations
          .map((l) => `  section=${l.sectionId} entry=${l.entryId} fact=${l.factId} text="${l.factText}"`)
          .join("\n")}`
      );
    }

    if (missingIds.size > 0) {
      errors.push(
        `Missing evidence IDs referenced in resume:\n${[...missingIds.entries()]
          .map(([id, contexts]) => `  ${id} referenced at ${contexts.map((c) => `${c.sectionId}/${c.entryId}/${c.factId}`).join(", ")}`)
          .join("\n")}`
      );
    }

    if (mismatchedSnapshots.length > 0) {
      errors.push(
        `Evidence snapshot mismatches:\n${mismatchedSnapshots
          .map(
            (m) =>
              `  ${m.evidenceId}: expected="${m.expected}" actual="${m.actual}" referencedAt=${m.locations
                .map((c) => `${c.sectionId}/${c.entryId}/${c.factId}`)
                .join(", ")}`
          )
          .join("\n")}`
      );
    }

    if (errors.length > 0) {
      throw new Error(`Evidence validation failed:\n${errors.join("\n\n")}`);
    }
  }
}
