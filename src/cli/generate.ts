import fs from "node:fs";
import path from "node:path";

import { DEFAULT_OPTIMIZER_CONFIG, DEFAULT_SCORER_WEIGHTS } from "../config/weights";
import { ResumeOptimizer } from "../optimizer/ResumeOptimizer";
import { CandidateParser } from "../parser/CandidateParser";
import { JobParser } from "../parser/JobParser";
import { CompositeScorer, buildCompositeWeights } from "../ranking/CompositeScorer";
import { KeywordScorer } from "../ranking/KeywordScorer";
import { PreferredQualificationScorer } from "../ranking/PreferredQualificationScorer";
import { RequiredQualificationScorer } from "../ranking/RequiredQualificationScorer";
import { ResponsibilityScorer } from "../ranking/ResponsibilityScorer";
import { SkillScorer } from "../ranking/SkillScorer";
import { TitleScorer } from "../ranking/TitleScorer";
import { HtmlRenderer } from "../renderer/HtmlRenderer";
import { JsonRenderer } from "../renderer/JsonRenderer";
import { EvidenceValidator } from "../validator/EvidenceValidator";
import { ResumeValidator } from "../validator/ResumeValidator";
import { SchemaValidator } from "../validator/SchemaValidator";

interface CliArgs {
  readonly candidatePath: string;
  readonly jobsPath: string;
  readonly outDir: string;
  readonly validateOnly: boolean;
  readonly jsonLogs: boolean;
  readonly jobId?: string;
}

function parseArgs(argv: readonly string[]): CliArgs {
  const args = new Map<string, string>();
  const flags = new Set<string>();
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token || !token.startsWith("--")) {
      continue;
    }
    // flags without value
    if (token === "--validate-only" || token === "--json-logs") {
      flags.add(token);
      continue;
    }
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args.set(token, next);
      i += 1;
    }
  }

  const candidatePath = args.get("--candidate") ?? "candidate.json";
  const jobsPath = args.get("--jobs") ?? "job_postings.json";
  const outDir = args.get("--outDir") ?? "output";
  const validateOnly = flags.has("--validate-only");
  const jsonLogs = flags.has("--json-logs");
  const jobId = args.get("--job-id");

  return { candidatePath, jobsPath, outDir, validateOnly, jsonLogs, jobId };
}

function readJson(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as unknown;
}

function sanitizeFileSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]/g, "_");
}

export function runGenerateCommand(argv: readonly string[]): number {
  const args = parseArgs(argv);

  const candidateParser = new CandidateParser();
  const jobParser = new JobParser();
  const scorer = new CompositeScorer({
    scorers: [
      new KeywordScorer(),
      new SkillScorer(),
      new ResponsibilityScorer(),
      new TitleScorer(),
      new RequiredQualificationScorer(),
      new PreferredQualificationScorer()
    ],
    weights: buildCompositeWeights(DEFAULT_SCORER_WEIGHTS)
  });
  const optimizer = new ResumeOptimizer({
    scorer,
    config: DEFAULT_OPTIMIZER_CONFIG
  });
  const jsonRenderer = new JsonRenderer();
  const htmlRenderer = new HtmlRenderer();
  const evidenceValidator = new EvidenceValidator();
  const resumeValidator = new ResumeValidator(DEFAULT_OPTIMIZER_CONFIG);
  const schemaValidator = new SchemaValidator();

  const parsedCandidate = candidateParser.parse(readJson(args.candidatePath));
  const jobPostings = jobParser.parse(readJson(args.jobsPath));
  const evidenceRegistry = parsedCandidate.evidenceRegistry;

  fs.mkdirSync(args.outDir, { recursive: true });

  const selectedJobs = args.jobId ? jobPostings.filter((j) => j.id === args.jobId) : jobPostings;

  const results: Array<{ jobId: string; ok: boolean; error?: any }> = [];

  for (const jobPosting of selectedJobs) {
    try {
      const resume = optimizer.optimize({
        candidate: parsedCandidate.candidate,
        candidateFacts: parsedCandidate.facts,
        jobPosting
      });

      evidenceValidator.validate(resume, evidenceRegistry);
      resumeValidator.validate(resume);
      schemaValidator.validate(resume);

      if (!args.validateOnly) {
        const jobFolder = path.join(args.outDir, sanitizeFileSegment(jobPosting.id));
        fs.mkdirSync(jobFolder, { recursive: true });
        fs.writeFileSync(path.join(jobFolder, "resume.json"), jsonRenderer.render(resume), "utf-8");
        fs.writeFileSync(path.join(jobFolder, "resume.html"), htmlRenderer.render(resume), "utf-8");
      }

      results.push({ jobId: jobPosting.id, ok: true });
    } catch (err) {
      results.push({ jobId: jobPosting.id, ok: false, error: err });
    }
  }

  // If jsonLogs requested, print JSON report
  if (args.jsonLogs) {
    const out = results.map((r) => ({ jobId: r.jobId, ok: r.ok, error: r.ok ? null : formatErrorForJson(r.error) }));
    console.log(JSON.stringify({ results: out }, null, 2));
  } else {
    for (const r of results) {
      if (r.ok) {
        console.log(`Job ${r.jobId}: OK`);
      } else {
        console.error(`Job ${r.jobId}: ERROR`);
        if (r.error instanceof Error) {
          console.error(r.error.message);
        } else {
          console.error(String(r.error));
        }
      }
    }
  }

  // exit non-zero if any failed
  return results.some((r) => !r.ok) ? 1 : 0;
}

function formatErrorForJson(err: any): unknown {
  if (!err) return null;
  if (err && typeof err === "object") {
    const e = err as any;
    if (e.details && Array.isArray(e.details)) {
      return { message: e.message, details: e.details };
    }
  }
  return { message: String(err) };
}

if (require.main === module) {
  const code = runGenerateCommand(process.argv);
  process.exit(code);
}
