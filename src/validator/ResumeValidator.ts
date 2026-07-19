import type { OptimizerConfig } from "../config/weights";
import { DEFAULT_OPTIMIZER_CONFIG } from "../config/weights";
import type { Resume } from "../models/Resume";
import { ValidationError, type ValidationErrorDetail } from "./ValidationError";

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
    const details: ValidationErrorDetail[] = [];

    const sectionTypes = new Set(resume.sections.map((section) => section.type));
    const missingRequired = this.config.requiredSections.filter(
      (required) => !sectionTypes.has(required as (typeof resume.sections)[number]["type"])
    );
    if (missingRequired.length > 0) {
      details.push({
        code: "missing_required_sections",
        message: `Missing required sections: ${missingRequired.join(", ")}`,
        locations: missingRequired.map((section) => `sections/${section}`)
      });
    }

    for (const section of resume.sections) {
      const bullets = section.entries.reduce((count, entry) => count + entry.facts.length, 0);
      if (bullets > this.config.maxBulletsPerSection) {
        details.push({
          code: "section_bullet_limit_exceeded",
          message: `Section "${section.type}" exceeds max bullets (${bullets}/${this.config.maxBulletsPerSection})`,
          sectionId: section.id,
          expected: this.config.maxBulletsPerSection,
          actual: bullets
        });
      }
    }

    if (resume.metadata.pageCountEstimate > this.config.maxPageCount) {
      details.push({
        code: "page_count_exceeded",
        message: `Page estimate exceeds limit (${resume.metadata.pageCountEstimate}/${this.config.maxPageCount})`,
        expected: this.config.maxPageCount,
        actual: resume.metadata.pageCountEstimate
      });
    }

    if (details.length > 0) {
      throw new ValidationError("Resume validation failed", details, "resume_validation_failed");
    }
  }
}
