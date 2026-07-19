import type { OptimizerConfig } from "../config/weights";
import { DEFAULT_OPTIMIZER_CONFIG } from "../config/weights";
import type { Resume } from "../models/Resume";

/**
 * Validates structural constraints on generated resumes.
 */
export class ResumeValidator {
  // TODO: Add configurable policy sets for different resume output targets.
  private readonly config: OptimizerConfig;

  constructor(config: OptimizerConfig = DEFAULT_OPTIMIZER_CONFIG) {
    this.config = config;
  }

  validate(resume: Resume): void {
    const sectionTypes = new Set(resume.sections.map((section) => section.type));
    const missingRequired = this.config.requiredSections.filter(
      (required) => !sectionTypes.has(required as (typeof resume.sections)[number]["type"])
    );
    if (missingRequired.length > 0) {
      throw new Error(`Resume validation failed. Missing required sections: ${missingRequired.join(", ")}`);
    }

    for (const section of resume.sections) {
      const bullets = section.entries.reduce((count, entry) => count + entry.facts.length, 0);
      if (bullets > this.config.maxBulletsPerSection) {
        throw new Error(
          `Resume validation failed. Section "${section.type}" exceeds max bullets (${bullets}/${this.config.maxBulletsPerSection}).`
        );
      }
    }

    if (resume.metadata.pageCountEstimate > this.config.maxPageCount) {
      throw new Error(
        `Resume validation failed. Page estimate exceeds limit (${resume.metadata.pageCountEstimate}/${this.config.maxPageCount}).`
      );
    }
  }
}
