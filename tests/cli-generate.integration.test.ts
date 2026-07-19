import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { runGenerateCommand } from "../src/cli/generate";
import { candidateFixture, jobPostingFixture } from "./fixtures";
import { ResumeValidator } from "../src/validator/ResumeValidator";
import { ValidationError } from "../src/validator/ValidationError";

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

describe("CLI generate integration flags", () => {
  const spies: Array<ReturnType<typeof vi.spyOn>> = [];
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const spy of spies) {
      spy.mockRestore();
    }
    spies.length = 0;

    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it("--validate-only validates but does not write resume files", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "resume-opt-"));
    tempDirs.push(tempRoot);
    const candidatePath = path.join(tempRoot, "candidate.json");
    const jobsPath = path.join(tempRoot, "job_postings.json");
    const outDir = path.join(tempRoot, "output");

    const testCandidatePayload = {
      candidate: {
        id: "candidate-1",
        name: "Alex Candidate",
        summary: "This is a summary to pass validation",
        experiences: [
          {
            id: "exp-1",
            title: "Software Engineer",
            organization: "Acme",
            start_date: "2022-01-01",
            facts: [{ id: "f1", text: "Built APIs", skills: [] }]
          }
        ],
        skills: [{ id: "skill-1", name: "TypeScript" }]
      }
    };
    writeJson(candidatePath, testCandidatePayload);
    writeJson(jobsPath, [jobPostingFixture]);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    spies.push(logSpy, errSpy);

    const exitCode = runGenerateCommand([
      "node",
      "dist/cli/generate.js",
      "--candidate",
      candidatePath,
      "--jobs",
      jobsPath,
      "--outDir",
      outDir,
      "--validate-only"
    ]);

    expect(exitCode).toBe(0);
    expect(fs.existsSync(path.join(outDir, jobPostingFixture.id, "resume.json"))).toBe(false);
    expect(fs.existsSync(path.join(outDir, jobPostingFixture.id, "resume.html"))).toBe(false);
  });

  it("--json-logs emits structured errors when validation fails", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "resume-opt-"));
    tempDirs.push(tempRoot);
    const candidatePath = path.join(tempRoot, "candidate.json");
    const jobsPath = path.join(tempRoot, "job_postings.json");
    const outDir = path.join(tempRoot, "output");

    const invalidCandidate = {
      candidate: {
        id: "candidate-missing-sections",
        name: "No Experience Candidate",
        skills: [{ id: "skill-1", name: "TypeScript" }]
      }
    };

    writeJson(candidatePath, invalidCandidate);
    writeJson(jobsPath, [jobPostingFixture]);

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    spies.push(logSpy, errSpy);

    // FIX: Because our WEC pipeline upgrades automatically fix the invalid candidate above, 
    // it never naturally fails! We use a mock to force the specific error Person 4's test expects.
    const validatorSpy = vi.spyOn(ResumeValidator.prototype, "validate").mockImplementation(() => {
      throw new ValidationError(
        "Resume validation failed",
        [{ code: "missing_required_sections", message: "Missing required sections", locations: [] }],
        "resume_validation_failed"
      );
    });
    spies.push(validatorSpy);

    const exitCode = runGenerateCommand([
      "node",
      "dist/cli/generate.js",
      "--candidate",
      candidatePath,
      "--jobs",
      jobsPath,
      "--outDir",
      outDir,
      "--validate-only",
      "--json-logs"
    ]);

    expect(exitCode).toBe(1);
    expect(logSpy).toHaveBeenCalled();
    const lastLog = logSpy.mock.calls.at(-1);
    const payload = JSON.parse(String(lastLog?.[0])) as {
      results: Array<{
        ok: boolean;
        error: null | { message: string; details?: Array<{ code: string }> };
      }>;
    };
    expect(payload.results[0]?.ok).toBe(false);
    expect(payload.results[0]?.error?.details?.some((detail) => detail.code === "missing_required_sections")).toBe(
      true
    );
  });
});