import type { Resume } from "../models/Resume";

/**
 * Ensures each referenced evidence ID maps to known candidate evidence.
 */
export class EvidenceValidator {
  // TODO: Add richer diagnostics for missing evidence grouped by section and entry.
  validate(resume: Resume, availableEvidenceIds: ReadonlySet<string>): void {
    const missing: string[] = [];

    for (const section of resume.sections) {
      for (const entry of section.entries) {
        for (const fact of entry.facts) {
          for (const evidenceId of fact.evidenceIds) {
            if (!availableEvidenceIds.has(evidenceId)) {
              missing.push(evidenceId);
            }
          }
        }
      }
    }

    if (missing.length > 0) {
      const unique = [...new Set(missing)].join(", ");
      throw new Error(`Evidence validation failed. Missing evidence IDs: ${unique}`);
    }
  }
}
