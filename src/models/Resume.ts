import type { ResumeSection } from "./Section";

export interface ResumeMetadata {
  readonly pageCountEstimate: number;
  readonly maxBulletsPerSection: number;
  readonly generatedBy: string;
}

export interface Resume {
  readonly candidateId: string;
  readonly jobPostingId: string;
  readonly generatedAt: string;
  readonly metadata: ResumeMetadata;
  readonly sections: readonly ResumeSection[];
}
