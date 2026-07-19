# 📄 Resume Optimizer Engine

An automated, highly scalable ETL pipeline that mathematically optimizes applicant resumes against target job postings. 

Built for the Waterloo Engineering Competition (WEC), this engine guarantees **100% factual integrity**. It explicitly avoids generative LLMs at runtime to ensure that no information is ever hallucinated, fabricated, or misrepresented.

## 🚀 Overview: The "Selection, Not Generation" Guarantee

Most automated resume tailors pass candidate data to a generative AI, which invariably risks hallucinating metrics or fabricating skills. Our system rejects this approach.

Instead, we treat optimization as a **search and ranking problem**. The engine parses a candidate's history into granular, atomic `Facts`. It scores every single fact against the target job posting using Jaccard-similarity token evaluation, and dynamically reconstructs the resume using *only the highest-scoring, mathematically relevant facts*. 

Every bullet point is cryptographically traced back to the candidate's original input via our **Evidence Registry**, guaranteeing absolute truthfulness.

## 🏛️ System Architecture 

The application is built on a highly modular, decoupled **Unidirectional Data Pipeline**, ensuring O(N log N) performance and infinite scalability:

1. **Extraction (Parsers)**: `Zod`-backed parsers ingest and validate raw candidate and job posting JSONs, failing safely if schemas are malformed.
2. **Normalization**: Hierarchical candidate data (experiences, education, skills) is flattened into atomic `Fact` objects, completely decoupling the scoring engine from the data structure.
3. **Evaluation (Scoring Engine)**: A `CompositeScorer` evaluates facts using multiple extensible algorithms (e.g., `RequiredQualificationScorer`, `ResponsibilityScorer`, `TitleScorer`).
4. **Optimization**: Facts are sorted by relevance. The `BulletLimiter` and `SectionOrganizer` truncate entries to meet strict WEC length constraints while maintaining chronological flow.
5. **Validation Firewall**: A strict `ResumeValidator` intercepts the final JSON. If a required section is missing, or a bullet lacks a verifiable `evidenceId`, the engine halts.
6. **Load (Renderer)**: Outputs a validated `resume.json` and a professionally styled, letter-sized printable `resume.html`.

## 🛠️ Core Features
- **Deterministic Output**: Reproducible builds and predictable algorithmic scoring. Zero randomness.
- **Graceful Degradation**: Handles sparse candidate data by dynamically generating empty required sections to remain spec-compliant.
- **O(1) Map Lookups**: Highly performant grouping algorithms ready to scale to thousands of records.
- **Decoupled UI**: Uses Handlebars (`.hbs`) for logic-less HTML templating, embedding strict `@page` CSS for perfect printing.

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
npm install
npm run build
```

### Running the CLI

Run the optimizer end-to-end against a candidate and target job postings:
```bash
node dist/cli/generate.js --candidate candidate.json --jobs formats/job_postings.json --outDir output
```

To run a dry-run without writing files to disk (useful for CI/CD integration):
```bash
node dist/cli/generate.js --candidate candidate.json --jobs formats/job_postings.json --outDir output --validate-only
```

---

## 🤖 AI Disclosure & Environmental Impact

In line with the Waterloo Engineering Competition AI policy, we used AI tools for research, and disclosed every use, tool, purpose, and prompt in our README. We used GitHub Copilot, Claude, and Gemini in our development.

Studies estimate a typical AI query costs about 0.24 to 0.42 watt-hours of electricity and roughly 0.15 grams of carbon dioxide, with water use tracking electricity for cooling. Applying our own query count from development (estimated at 300 queries), our total usage comes to approximately **99 watt-hours** and **45 grams** of carbon dioxide, comparable to roughly **charging a typical smartphone fully about 7 times** (assuming a standard 14Wh battery). We kept our environmental impact relatively low, especially since we chose not to use LLMs or AI directly in our runtime code.
