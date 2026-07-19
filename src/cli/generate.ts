import fs from "node:fs";
import path from "node:path";

import { DEFAULT_OPTIMIZER_CONFIG, DEFAULT_SCORER_WEIGHTS } from "../config/weights";
import { ResumeOptimizer } from "../optimizer/ResumeOptimizer";
import { CandidateParser } from "../parser/CandidateParser";
import { JobParser } from "../parser/JobParser";
import { CompositeScorer, buildCompositeWeights } from "../ranking/CompositeScorer";
import { KeywordScorer } from "../ranking/KeywordScorer";
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
}

function parseArgs(argv: readonly string[]): CliArgs {
  const args = new Map<string, string>();
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token || !token.startsWith("--")) {
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

  return { candidatePath, jobsPath, outDir };
}

function readJson(filePath: string): unknown {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as unknown;
}

function sanitizeFileSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9-_]/g, "_");
}

export function runGenerateCommand(argv: readonly string[]): void {
  const args = parseArgs(argv);

  const candidateParser = new CandidateParser();
  const jobParser = new JobParser();
  const scorer = new CompositeScorer({
    scorers: [new KeywordScorer(), new SkillScorer(), new ResponsibilityScorer(), new TitleScorer()],
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

  for (const jobPosting of jobPostings) {
    const resume = optimizer.optimize({
      candidate: parsedCandidate.candidate,
      candidateFacts: parsedCandidate.facts,
      jobPosting
    });

    evidenceValidator.validate(resume, evidenceRegistry);
    resumeValidator.validate(resume);
    schemaValidator.validate(resume);

    const jobFolder = path.join(args.outDir, sanitizeFileSegment(jobPosting.id));
    fs.mkdirSync(jobFolder, { recursive: true });
    fs.writeFileSync(path.join(jobFolder, "resume.json"), jsonRenderer.render(resume), "utf-8");
    fs.writeFileSync(path.join(jobFolder, "resume.html"), htmlRenderer.render(resume), "utf-8");
  }
}

if (require.main === module) {
  runGenerateCommand(process.argv);
}
