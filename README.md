# resume-optimizer

Production-quality baseline architecture for a CLI resume optimization engine.

## Goals

- Clean, extensible architecture for hackathon-speed iteration.
- Strict evidence mapping: output facts must trace to candidate evidence.
- Placeholder scoring and optimization flow (no advanced ranking yet).

## Stack

- TypeScript + Node.js
- pnpm
- Zod
- Vitest
- ESLint + Prettier
- Handlebars (HTML rendering)

## Project Structure

```text
src/
  models/
  parser/
  ranking/
    interfaces/
  optimizer/
  renderer/
    templates/
  validator/
  utils/
  config/
  cli/
  index.ts
tests/
```

## Data Flow

1. Parse `candidate.json` and flatten candidate evidence into `Fact[]`.
2. Parse `job_postings.json` into strongly typed `JobPosting[]`.
3. Score facts with `CompositeScorer` (weighted placeholder scorers).
4. Optimize via baseline pipeline: collect → score → sort → select → sectionize → bullet-limit.
5. Validate evidence references, resume structural constraints, and JSON schema.
6. Render each job-specific resume to:
   - `resume.json`
   - `resume.html`

## Run

```bash
pnpm install
pnpm test
pnpm build
```

### CLI

```bash
node dist/cli/generate.js --candidate candidate.json --jobs job_postings.json --outDir output
```

Defaults:

- `--candidate candidate.json`
- `--jobs job_postings.json`
- `--outDir output`

Output per job:

```text
output/<job-id>/resume.json
output/<job-id>/resume.html
```

## Extensibility Points

- Add new scorers implementing `IScorer`.
- Plug custom sectioning into `SectionOrganizer`.
- Replace selection heuristics in `ResumeOptimizer`.
- Add policy packs in validators.
- Swap/extend Handlebars templates for formatting variants.
