export type FactSourceType =
  | "experience"
  | "project"
  | "certification"
  | "education"
  | "skill"
  | "summary";

export type FactMetadataValue = string | number | boolean | null;

export interface Fact {
  readonly id: string;
  readonly text: string;
  readonly sourceType: FactSourceType;
  readonly parentId: string;
  readonly keywords: readonly string[];
  readonly metadata: Readonly<Record<string, FactMetadataValue>>;
  readonly score: number;
  readonly evidenceIds: readonly string[];
}
