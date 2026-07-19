import type { Resume } from "../models/Resume";

/**
 * Serializes resume models into stable JSON output for downstream systems.
 */
export class JsonRenderer {
  render(resume: Resume): string {
    return JSON.stringify(resume, null, 2);
  }
}
