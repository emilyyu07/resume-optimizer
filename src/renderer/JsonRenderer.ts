import type { Resume } from "../models/Resume";

/**
 * Serializes resume models into stable JSON output for downstream systems.
 */
export class JsonRenderer {
  // TODO: Add JSON schema version metadata once output contracts are versioned.
  render(resume: Resume): string {
    const { jobPostingId, ...submissionResume } = resume;
    return JSON.stringify(submissionResume, null, 2);
  }
}