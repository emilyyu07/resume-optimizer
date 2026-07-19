import type { Fact } from "./Fact";

export interface ResumeEntry {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly facts: readonly Fact[];
  readonly score: number;
  readonly evidenceIds: readonly string[];
}
