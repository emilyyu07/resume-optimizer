import type { ResumeEntry } from "../models/Entry";
import type { ResumeSection } from "../models/Section";

export interface BulletLimiterOptions {
  readonly maxFactsPerEntry: number;
  readonly maxBulletsPerSection: number;
}

/**
 * Caps fact volume per entry/section to keep output bounded and predictable.
 */
export class BulletLimiter {
  // TODO: Support adaptive limits based on estimated page space.
  limit(
    sections: readonly ResumeSection[],
    options: BulletLimiterOptions
  ): readonly ResumeSection[] {
    return sections.map((section) => {
      let sectionBulletCount = 0;
      const limitedEntries: ResumeEntry[] = [];

      for (const entry of section.entries) {
        if (sectionBulletCount >= options.maxBulletsPerSection) {
          break;
        }

        const remaining = options.maxBulletsPerSection - sectionBulletCount;
        const allowed = Math.min(options.maxFactsPerEntry, remaining);
        const limitedFacts = entry.facts.slice(0, allowed);
        sectionBulletCount += limitedFacts.length;

        limitedEntries.push({
          ...entry,
          facts: limitedFacts,
          evidenceIds: [...new Set(limitedFacts.flatMap((fact) => fact.evidenceIds))]
        });
      }

      return {
        ...section,
        entries: limitedEntries
      };
    });
  }
}
