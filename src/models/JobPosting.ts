export interface JobPosting {
  readonly id: string;
  readonly title: string;
  readonly company?: string;
  readonly summary?: string;
  readonly requiredQualifications: readonly string[];
  readonly preferredQualifications: readonly string[];
  readonly responsibilities: readonly string[];
  readonly keywords: readonly string[];
}
