import { z } from "zod";

import type {
  Candidate,
  Certification,
  Education,
  Experience,
  Project,
  Skill
} from "../models/Candidate";
import type { Fact } from "../models/Fact";
import { extractKeywords } from "../utils/keywords";

const ExperienceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  summary: z.string().optional(),
  bullets: z.array(z.string().min(1)).default([]),
  skills: z.array(z.string().min(1)).default([])
});

const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().optional(),
  bullets: z.array(z.string().min(1)).default([]),
  skills: z.array(z.string().min(1)).default([])
});

const CertificationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  issuer: z.string().min(1),
  date: z.string().optional()
});

const EducationSchema = z.object({
  id: z.string().min(1),
  institution: z.string().min(1),
  degree: z.string().min(1),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

const SkillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().optional(),
  proficiency: z.string().optional()
});

const CandidateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  summary: z.string().optional(),
  experiences: z.array(ExperienceSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  education: z.array(EducationSchema).default([]),
  skills: z.array(SkillSchema).default([])
});

export interface ParsedCandidate {
  readonly candidate: Candidate;
  readonly facts: readonly Fact[];
}

/**
 * Parses candidate JSON and flattens evidence-backed facts for downstream scoring.
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

    const candidate = this.toCandidate(parsed.data);
    return {
      candidate,
      facts: this.flattenFacts(candidate)
    };
  }

  private toCandidate(input: z.infer<typeof CandidateSchema>): Candidate {
    return {
      id: input.id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      summary: input.summary,
      experiences: input.experiences.map((experience) => this.toExperience(experience)),
      projects: input.projects.map((project) => this.toProject(project)),
      certifications: input.certifications.map((certification) =>
        this.toCertification(certification)
      ),
      education: input.education.map((education) => this.toEducation(education)),
      skills: input.skills.map((skill) => this.toSkill(skill))
    };
  }

  private toExperience(input: z.infer<typeof ExperienceSchema>): Experience {
    return {
      id: input.id,
      title: input.title,
      company: input.company,
      startDate: input.startDate,
      endDate: input.endDate,
      summary: input.summary,
      bullets: input.bullets,
      skills: input.skills
    };
  }

  private toProject(input: z.infer<typeof ProjectSchema>): Project {
    return {
      id: input.id,
      name: input.name,
      summary: input.summary,
      bullets: input.bullets,
      skills: input.skills
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
      field: input.field,
      startDate: input.startDate,
      endDate: input.endDate
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

  private flattenFacts(candidate: Candidate): readonly Fact[] {
    const facts: Fact[] = [];

    if (candidate.summary) {
      facts.push(
        this.createFact(`summary:${candidate.id}`, candidate.summary, "summary", candidate.id, {
          candidateName: candidate.name
        })
      );
    }

    for (const experience of candidate.experiences) {
      if (experience.summary) {
        facts.push(
          this.createFact(
            `experience:${experience.id}:summary`,
            experience.summary,
            "experience",
            experience.id,
            { title: experience.title, company: experience.company }
          )
        );
      }
      experience.bullets.forEach((bullet, index) => {
        facts.push(
          this.createFact(
            `experience:${experience.id}:bullet:${index}`,
            bullet,
            "experience",
            experience.id,
            { title: experience.title, company: experience.company }
          )
        );
      });
    }

    for (const project of candidate.projects) {
      if (project.summary) {
        facts.push(
          this.createFact(`project:${project.id}:summary`, project.summary, "project", project.id, {
            name: project.name
          })
        );
      }
      project.bullets.forEach((bullet, index) => {
        facts.push(
          this.createFact(`project:${project.id}:bullet:${index}`, bullet, "project", project.id, {
            name: project.name
          })
        );
      });
    }

    for (const certification of candidate.certifications) {
      facts.push(
        this.createFact(
          `certification:${certification.id}`,
          `${certification.name} (${certification.issuer})`,
          "certification",
          certification.id,
          { issuer: certification.issuer, date: certification.date ?? null }
        )
      );
    }

    for (const education of candidate.education) {
      const educationFact = [education.degree, education.field, education.institution]
        .filter(Boolean)
        .join(" - ");
      facts.push(
        this.createFact(`education:${education.id}`, educationFact, "education", education.id, {
          institution: education.institution
        })
      );
    }

    for (const skill of candidate.skills) {
      facts.push(
        this.createFact(`skill:${skill.id}`, skill.name, "skill", skill.id, {
          category: skill.category ?? null,
          proficiency: skill.proficiency ?? null
        })
      );
    }

    return facts;
  }

  private createFact(
    id: string,
    text: string,
    sourceType: Fact["sourceType"],
    parentId: string,
    metadata: Readonly<Record<string, string | number | boolean | null>>
  ): Fact {
    return {
      id,
      text,
      sourceType,
      parentId,
      keywords: extractKeywords(text),
      metadata,
      score: 0,
      evidenceIds: [id]
    };
  }
}
