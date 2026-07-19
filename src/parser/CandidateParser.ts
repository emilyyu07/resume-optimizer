import { z } from "zod";

import type {
  Candidate,
  Certification,
  Education,
  Experience,
  Project,
  Skill
} from "../models/Candidate";
import type { Fact, FactMetadataValue } from "../models/Fact";
import { extractKeywords } from "../utils/keywords";

// --- Zod schemas matching the WEC competition input format ---

const FactItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  skills: z.array(z.string().min(1)).default([])
});

const ContactSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  linkedin: z.string().optional(),
  location: z.string().optional()
});

const ExperienceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  organization: z.string().min(1),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  facts: z.array(FactItemSchema).default([])
});

const ProjectSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  organization: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  facts: z.array(FactItemSchema).default([])
});

const EducationSchema = z.object({
  id: z.string().min(1),
  institution: z.string().min(1),
  degree: z.string().min(1),
  program: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  location: z.string().optional(),
  facts: z.array(FactItemSchema).default([])
});

const CertificationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  issuer: z.string().min(1),
  date: z.string().optional(),
  facts: z.array(FactItemSchema).default([])
});

const SkillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional(),
  proficiency: z.string().optional()
});

const CandidatePayloadSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  contact: ContactSchema.optional(),
  summary: z.string().optional(),
  education: z.array(EducationSchema).default([]),
  skills: z.array(SkillSchema).default([]),
  experiences: z.array(ExperienceSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  applied_job_posting_ids: z.array(z.string()).default([])
});

type CandidatePayload = z.infer<typeof CandidatePayloadSchema>;

// Accept both wrapped { candidate: {...} } and bare payload formats
const CandidateSchema = z.union([
  z.object({ candidate: CandidatePayloadSchema }),
  CandidatePayloadSchema
]);

export interface EvidenceInfo {
  readonly sourcePath: string;
  readonly sourceSnapshot: string;
}

export interface ParsedCandidate {
  readonly candidate: Candidate;
  readonly facts: readonly Fact[];
  readonly evidenceRegistry: ReadonlyMap<string, EvidenceInfo>;
}

/**
 * Parses candidate JSON in WEC competition format and flattens evidence-backed facts
 * for downstream scoring.
 */
export class CandidateParser {
  // TODO: Extend schema/versioning support for multiple candidate input formats.
  parse(input: unknown): ParsedCandidate {
    const parsed = CandidateSchema.safeParse(input);
    if (!parsed.success) {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
        .join("; ");
      throw new Error(`Invalid candidate.json payload: ${details}`);
    }

    const payload: CandidatePayload =
      "candidate" in parsed.data ? parsed.data.candidate : parsed.data;

    const candidate = this.toCandidate(payload);
    this.assertUniqueEntityIds(candidate);
    const facts = this.flattenFactsFromPayload(payload);
    const evidenceRegistry = this.buildEvidenceRegistry(facts);
    return {
      candidate,
      facts,
      evidenceRegistry
    };
  }

  private buildEvidenceRegistry(facts: readonly Fact[]) {
    const m = new Map<string, { sourcePath: string; sourceSnapshot: string }>();
    for (const fact of facts) {
      m.set(fact.id, { sourcePath: fact.metadata.sourcePath, sourceSnapshot: fact.metadata.sourceSnapshot });
    }
    if (m.size !== facts.length) {
      throw new Error(
        `Evidence registry construction failed: expected ${facts.length} entries but found ${m.size}.`
      );
    }
    return m;
  }

  private assertUniqueEntityIds(candidate: Candidate): void {
    const duplicates: string[] = [];

    const check = (label: string, ids: readonly string[]) => {
      const seen = new Set<string>();
      const dupes = new Set<string>();
      for (const id of ids) {
        if (seen.has(id)) {
          dupes.add(id);
        } else {
          seen.add(id);
        }
      }
      if (dupes.size > 0) {
        duplicates.push(`${label}: ${[...dupes].join(", ")}`);
      }
    };

    check(
      "experiences",
      candidate.experiences.map((experience) => experience.id)
    );
    check(
      "projects",
      candidate.projects.map((project) => project.id)
    );
    check(
      "certifications",
      candidate.certifications.map((certification) => certification.id)
    );
    check(
      "education",
      candidate.education.map((education) => education.id)
    );
    check(
      "skills",
      candidate.skills.map((skill) => skill.id)
    );

    if (duplicates.length > 0) {
      throw new Error(
        `Invalid candidate.json payload: duplicate candidate entity IDs detected (${duplicates.join("; ")}).`
      );
    }
  }

  private generateId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private toCandidate(payload: CandidatePayload): Candidate {
    const id = payload.id ?? this.generateId(payload.name);
    return {
      id,
      name: payload.name,
      email: payload.contact?.email,
      phone: payload.contact?.phone,
      summary: payload.summary,
      experiences: payload.experiences.map((experience) => this.toExperience(experience)),
      projects: payload.projects.map((project) => this.toProject(project)),
      certifications: payload.certifications.map((certification) =>
        this.toCertification(certification)
      ),
      education: payload.education.map((education) => this.toEducation(education)),
      skills: payload.skills.map((skill) => this.toSkill(skill))
    };
  }

  private toExperience(input: z.infer<typeof ExperienceSchema>): Experience {
    return {
      id: input.id,
      title: input.title,
      company: input.organization,
      startDate: input.start_date ?? "",
      endDate: input.end_date,
      summary: undefined,
      bullets: input.facts.map((f) => f.text),
      skills: [...new Set(input.facts.flatMap((f) => f.skills))]
    };
  }

  private toProject(input: z.infer<typeof ProjectSchema>): Project {
    return {
      id: input.id,
      name: input.title,
      summary: undefined,
      bullets: input.facts.map((f) => f.text),
      skills: [...new Set(input.facts.flatMap((f) => f.skills))]
    };
  }

  private toCertification(input: z.infer<typeof CertificationSchema>): Certification {
    return {
      id: input.id,
      name: input.name,
      issuer: input.issuer,
      date: input.date
    };
  }

  private toEducation(input: z.infer<typeof EducationSchema>): Education {
    return {
      id: input.id,
      institution: input.institution,
      degree: input.degree,
      field: input.program,
      startDate: input.start_date,
      endDate: input.end_date
    };
  }

  private toSkill(input: z.infer<typeof SkillSchema>): Skill {
    return {
      id: input.id,
      name: input.name,
      category: input.category,
      proficiency: input.proficiency
    };
  }

  /**
   * Flattens the raw parsed payload into a uniform Fact[] array.
   * Uses fact IDs provided in the competition format directly, preserving provenance.
   */
  private flattenFactsFromPayload(payload: CandidatePayload): readonly Fact[] {
    const facts: Fact[] = [];
    const seen = new Map<string, string>(); // fact id -> sourcePath
    const duplicates: Array<{ id: string; firstPath: string; duplicatePath: string }> = [];

    const pushFact = (fact: Fact) => {
      const firstPath = seen.get(fact.id);
      const currentPath = fact.metadata.sourcePath;
      if (firstPath) {
        duplicates.push({
          id: fact.id,
          firstPath,
          duplicatePath: currentPath
        });
        return;
      }
      seen.set(fact.id, currentPath);
      facts.push(fact);
    };

    const candidateId = payload.id ?? this.generateId(payload.name);

    // Summary fact (optional — competition format may not include a summary)
    if (payload.summary) {
      const fact = this.createFact(
        `summary:${candidateId}`,
        payload.summary,
        "summary",
        candidateId,
        "summary",
        "summary",
        { candidateName: payload.name }
      );
      pushFact(fact);
    }

    // Experience facts — use provided fact IDs from the competition format
    for (const experience of payload.experiences) {
      for (const factItem of experience.facts) {
        const fact = this.createFact(
          factItem.id,
          factItem.text,
          "experience",
          experience.id,
          `experiences.${experience.id}.facts.${factItem.id}`,
          "fact",
          { title: experience.title, company: experience.organization }
        );
        pushFact(fact);
      }
    }

    // Project facts
    for (const project of payload.projects) {
      for (const factItem of project.facts) {
        const fact = this.createFact(
          factItem.id,
          factItem.text,
          "project",
          project.id,
          `projects.${project.id}.facts.${factItem.id}`,
          "fact",
          { name: project.title }
        );
        pushFact(fact);
      }
    }

    // Certification facts — auto-generated name/issuer summary + explicit facts
    for (const certification of payload.certifications) {
      const summaryFact = this.createFact(
        `certification:${certification.id}`,
        `${certification.name} (${certification.issuer})`,
        "certification",
        certification.id,
        `certifications.${certification.id}`,
        "name",
        { issuer: certification.issuer, date: certification.date ?? null }
      );
      pushFact(summaryFact);

      for (const factItem of certification.facts) {
        const fact = this.createFact(
          factItem.id,
          factItem.text,
          "certification",
          certification.id,
          `certifications.${certification.id}.facts.${factItem.id}`,
          "fact",
          { issuer: certification.issuer, date: certification.date ?? null }
        );
        pushFact(fact);
      }
    }

    // Education facts — auto-generated degree summary + explicit facts (e.g. scholarships)
    for (const education of payload.education) {
      const educationText = [education.degree, education.program, education.institution]
        .filter(Boolean)
        .join(" - ");
      const summaryFact = this.createFact(
        `education:${education.id}`,
        educationText,
        "education",
        education.id,
        `education.${education.id}`,
        "degree",
        { institution: education.institution }
      );
      pushFact(summaryFact);

      for (const factItem of education.facts) {
        const fact = this.createFact(
          factItem.id,
          factItem.text,
          "education",
          education.id,
          `education.${education.id}.facts.${factItem.id}`,
          "fact",
          { institution: education.institution }
        );
        pushFact(fact);
      }
    }

    // Skill facts
    for (const skill of payload.skills) {
      const fact = this.createFact(
        `skill:${skill.id}`,
        skill.name,
        "skill",
        skill.id,
        `skills.${skill.id}.name`,
        "name",
        { category: skill.category ?? null, proficiency: skill.proficiency ?? null }
      );
      pushFact(fact);
    }

    if (duplicates.length > 0) {
      const details = duplicates
        .map(
          (duplicate) =>
            `${duplicate.id} (first=${duplicate.firstPath}, duplicate=${duplicate.duplicatePath})`
        )
        .join("; ");
      throw new Error(`Duplicate fact id(s) detected: ${details}`);
    }

    return facts;
  }

  private createFact(
    id: string,
    text: string,
    sourceType: Fact["sourceType"],
    parentId: string,
    sourcePath: string,
    sourceField: string,
    metadata: Readonly<Record<string, FactMetadataValue>>
  ): Fact {
    return {
      id,
      text,
      sourceType,
      parentId,
      keywords: extractKeywords(text),
      metadata: {
        sourcePath,
        sourceField,
        sourceSnapshot: text,
        ...metadata
      },
      score: 0,
      evidenceIds: [id]
    };
  }
}
