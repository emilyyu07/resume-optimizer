export type FactSourceType =
  | "experience"
  | "project"
  | "certification"
  | "education"
  | "skill"
  | "summary";

export type FactMetadataValue = string | number | boolean | null;

/**
 * Provenance metadata that every fact must carry.
 * This keeps each output statement traceable to candidate input evidence.
 */
export interface FactMetadata {
  readonly sourcePath: string;
  readonly sourceField: string;
  readonly sourceSnapshot: string;
  readonly [key: string]: FactMetadataValue;
}

export interface Fact {
  readonly id: string;
  readonly text: string;
  readonly sourceType: FactSourceType;
  readonly parentId: string;
  readonly keywords: readonly string[];
  readonly metadata: FactMetadata;
  readonly score: number;
  readonly evidenceIds: readonly string[];
}
