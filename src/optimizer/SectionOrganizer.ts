import type { Fact } from "../models/Fact";
import type { ResumeEntry } from "../models/Entry";
import type { ResumeSection, ResumeSectionType } from "../models/Section";

const SOURCE_TO_SECTION: Readonly<Record<Fact["sourceType"], ResumeSectionType>> = {
  summary: "summary",
  experience: "experience",
  project: "projects",
  skill: "skills",
  education: "education",
  certification: "certifications"
};

const SECTION_TITLES: Readonly<Record<ResumeSectionType, string>> = {
  summary: "Professional Summary",
  experience: "Experience",
  projects: "Projects",
  skills: "Skills",
  education: "Education",
  certifications: "Certifications"
};

/**
 * Groups selected facts into deterministic resume section and entry structures.
 */
export class SectionOrganizer {
  // TODO: Add configurable section ordering and custom section mapping.
  organize(facts: readonly Fact[]): readonly ResumeSection[] {
    const sectionMap = new Map<ResumeSectionType, Map<string, ResumeEntry>>();

    for (const fact of facts) {
      const sectionType = SOURCE_TO_SECTION[fact.sourceType];
      const sectionEntries = sectionMap.get(sectionType) ?? new Map<string, ResumeEntry>();
      sectionMap.set(sectionType, sectionEntries);

      const entryId = `${fact.sourceType}:${fact.parentId}`;
      const existingEntry = sectionEntries.get(entryId);
      if (existingEntry) {
        sectionEntries.set(entryId, {
          ...existingEntry,
          facts: [...existingEntry.facts, fact],
          score: Math.max(existingEntry.score, fact.score),
          evidenceIds: [...new Set([...existingEntry.evidenceIds, ...fact.evidenceIds])]
        });
      } else {
        sectionEntries.set(entryId, {
          id: entryId,
          title: this.entryTitleFromFact(fact),
          subtitle: this.entrySubtitleFromFact(fact),
          facts: [fact],
          score: fact.score,
          evidenceIds: fact.evidenceIds
        });
      }
    }

    return [...sectionMap.entries()]
      .map(([type, entries]) => ({
        id: type,
        type,
        title: SECTION_TITLES[type],
        entries: [...entries.values()].sort((left, right) => right.score - left.score)
      }))
      .sort((left, right) => this.sectionOrder(left.type) - this.sectionOrder(right.type));
  }

  private sectionOrder(section: ResumeSectionType): number {
    const order: readonly ResumeSectionType[] = [
      "summary",
      "experience",
      "projects",
      "skills",
      "education",
      "certifications"
    ];
    return order.indexOf(section);
  }

  private entryTitleFromFact(fact: Fact): string {
    if (typeof fact.metadata.title === "string" && fact.metadata.title.length > 0) {
      return fact.metadata.title;
    }
    if (typeof fact.metadata.name === "string" && fact.metadata.name.length > 0) {
      return fact.metadata.name;
    }
    if (typeof fact.metadata.institution === "string" && fact.metadata.institution.length > 0) {
      return fact.metadata.institution;
    }
    return fact.parentId;
  }

  private entrySubtitleFromFact(fact: Fact): string | undefined {
    if (typeof fact.metadata.company === "string" && fact.metadata.company.length > 0) {
      return fact.metadata.company;
    }
    if (typeof fact.metadata.issuer === "string" && fact.metadata.issuer.length > 0) {
      return fact.metadata.issuer;
    }
    return undefined;
  }
}
