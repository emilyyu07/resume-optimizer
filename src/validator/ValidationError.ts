export interface ValidationErrorDetail {
  code: string; // machine code e.g. 'empty_evidence', 'missing_evidence', 'snapshot_mismatch'
  message: string;
  evidenceId?: string;
  locations?: string[]; // e.g. ['section/entry/fact']
  sectionId?: string;
  entryId?: string;
  factId?: string;
  expected?: string | number;
  actual?: string | number;
}

export class ValidationError extends Error {
  override readonly name = "ValidationError";
  readonly code: string;
  readonly details: ValidationErrorDetail[];

  constructor(message: string, details: ValidationErrorDetail[], code = "validation_error") {
    super(`${message}: ${details.length} issue(s)`);
    this.code = code;
    this.details = details;
    // Set prototype explicitly for instanceof checks
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
