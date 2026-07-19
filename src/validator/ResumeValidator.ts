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
        message: `Missing config required sections: ${missingRequired.join(", ")}`,
        locations: missingRequired.map((section) => `sections/${section}`)
      });
    }

    // WEC CONSTRAINT FIX: Check TITLES instead of TYPES so we don't break Person 4's Schema Validator
    const sectionTitles = new Set(resume.sections.map((section) => section.title));
    const requiredByWEC = ["Education", "Experience", "Skills", "Personal information"];
    const missingWEC = requiredByWEC.filter(
      (required) => !sectionTitles.has(required)
    );
    if (missingWEC.length > 0) {
      details.push({
        code: "missing_wec_required_sections",
        message: `Missing WEC required sections: ${missingWEC.join(", ")}. These are mandatory.`,
        locations: missingWEC.map((section) => `sections/${section}`)
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
        } as ValidationErrorDetail); 
      }

      // WEC CONSTRAINT
      if (section.type === "experience" || section.type === "projects") {
        for (const entry of section.entries) {
          if (entry.facts.length > 4) {
             details.push({
               code: "wec_entry_bullet_limit_exceeded",
               message: `WEC Penalty Risk: Entry ${entry.id} exceeds 4 bullet points.`,
               sectionId: section.id,
               expected: 4,
               actual: entry.facts.length
             } as ValidationErrorDetail);
          }
        }
      }

      // WEC CONSTRAINT - Factuality / Evidence ID tracking to ensure no data is made up 
      // FIX: Check against title "Personal information" instead of type
      if (section.title !== "Personal information" && (section.type as string) !== "summary") {
        for (const entry of section.entries) {
          for (const fact of entry.facts) {
            if (!fact.evidenceIds || fact.evidenceIds.length === 0) {
               details.push({
                 code: "wec_factual_integrity_violation",
                 message: `Factual Integrity Violation: A fact in entry ${entry.id} lacks verifiable evidence IDs.`,
                 sectionId: section.id
               } as ValidationErrorDetail);
            }
          }
        }
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