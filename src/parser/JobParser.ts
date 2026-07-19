import { z } from "zod";

import type { JobPosting } from "../models/JobPosting";
import { extractKeywords } from "../utils/keywords";

const JobPostingSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  company: z.string().optional(),
  summary: z.string().optional(),
  requiredQualifications: z.array(z.string().min(1)).default([]),
  preferredQualifications: z.array(z.string().min(1)).default([]),
  responsibilities: z.array(z.string().min(1)).default([]),
  keywords: z.array(z.string().min(1)).default([])
});

const JobPostingsSchema = z.union([
  z.array(JobPostingSchema),
  z.object({
    jobs: z.array(JobPostingSchema)
  })
]);

/**
 * Parses job posting payloads into strongly typed models.
 */
export class JobParser {
  // TODO: Support additional third-party ATS schema variants.
  parse(input: unknown): readonly JobPosting[] {
    const parsed = JobPostingsSchema.safeParse(input);
    if (!parsed.success) {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
        .join("; ");
      throw new Error(`Invalid job_postings.json payload: ${details}`);
    }

    const jobs = Array.isArray(parsed.data) ? parsed.data : parsed.data.jobs;
    return jobs.map((job) => this.toJobPosting(job));
  }

  private toJobPosting(input: z.infer<typeof JobPostingSchema>): JobPosting {
    const keywordSeed = [
      input.title,
      input.summary ?? "",
      ...input.requiredQualifications,
      ...input.preferredQualifications,
      ...input.responsibilities,
      ...input.keywords
    ].join(" ");

    return {
      id: input.id,
      title: input.title,
      company: input.company,
      summary: input.summary,
      requiredQualifications: input.requiredQualifications,
      preferredQualifications: input.preferredQualifications,
      responsibilities: input.responsibilities,
      keywords: [...new Set([...input.keywords, ...extractKeywords(keywordSeed)])]
    };
  }
}
