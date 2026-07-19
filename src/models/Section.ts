import type { ResumeEntry } from "./Entry";

export type ResumeSectionType =
  | "summary"
  | "experience"
  | "projects"
  | "skills"
  | "education"
  | "certifications";

export interface ResumeSection {
  readonly id: string;
  readonly type: ResumeSectionType;
  readonly title: string;
  readonly entries: readonly ResumeEntry[];
}
