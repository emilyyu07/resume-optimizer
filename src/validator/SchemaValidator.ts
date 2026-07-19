import { z } from "zod";

import type { Resume } from "../models/Resume";

const FactSchema = z.object({
  id: z.string(),
  text: z.string(),
  sourceType: z.enum(["experience", "project", "certification", "education", "skill", "summary"]),
  parentId: z.string(),
  keywords: z.array(z.string()),
  metadata: z
    .object({
      sourcePath: z.string().min(1),
      sourceField: z.string().min(1),
      sourceSnapshot: z.string()
    })
    .catchall(z.union([z.string(), z.number(), z.boolean(), z.null()])),
  score: z.number(),
  evidenceIds: z.array(z.string())
});

const ResumeSchema = z.object({
  candidateId: z.string().min(1),
  jobPostingId: z.string().min(1),
  generatedAt: z.string().min(1),
  metadata: z.object({
    pageCountEstimate: z.number().int().positive(),
    maxBulletsPerSection: z.number().int().positive(),
    generatedBy: z.string().min(1)
  }),
  sections: z.array(
    z.object({
      id: z.string().min(1),
      type: z.enum(["summary", "experience", "projects", "skills", "education", "certifications"]),
      title: z.string().min(1),
      entries: z.array(
        z.object({
          id: z.string().min(1),
          title: z.string().min(1),
          subtitle: z.string().optional(),
          facts: z.array(FactSchema),
          score: z.number(),
          evidenceIds: z.array(z.string())
        })
      )
    })
  )
});

/**
 * Runs schema-level validation on serialized resume payloads.
 */
export class SchemaValidator {
  // TODO: Version and publish JSON schema for external API consumers.
  validate(input: unknown): Resume {
    const parsed = ResumeSchema.safeParse(input);
    if (!parsed.success) {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
        .join("; ");
      throw new Error(`Schema validation failed: ${details}`);
    }
    return parsed.data as Resume;
  }
}
