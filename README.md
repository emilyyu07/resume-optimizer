# WEC - Resume Optimizer Engine

An automated, highly scalable ETL pipeline that mathematically optimizes applicant resumes against target job postings.

Built for the Waterloo Engineering Competition (WEC), this engine guarantees **100% factual integrity**. It explicitly avoids generative LLMs at runtime to ensure that no information is ever hallucinated, fabricated, or misrepresented.

## Overview: The "Selection, Not Generation" Guarantee

Most automated resume tailors pass candidate data to a generative AI, which invariably risks hallucinating metrics or fabricating skills. Our system rejects this approach.

Instead, we treat optimization as a **search and ranking problem**. The engine parses a candidate's history into granular, atomic `Facts`. It scores every single fact against the target job posting using Jaccard-similarity token evaluation, and dynamically reconstructs the resume using _only the highest-scoring, mathematically relevant facts_.

Every bullet point is cryptographically traced back to the candidate's original input via our **Evidence Registry**, guaranteeing absolute truthfulness.

## System Architecture

The application is built on a highly modular, decoupled **Unidirectional Data Pipeline**, ensuring O(N log N) performance and infinite scalability:

1. **Extraction (Parsers)**: `Zod`-backed parsers ingest and validate raw candidate and job posting JSONs, failing safely if schemas are malformed.
2. **Normalization**: Hierarchical candidate data (experiences, education, skills) is flattened into atomic `Fact` objects, completely decoupling the scoring engine from the data structure.
3. **Evaluation (Scoring Engine)**: A `CompositeScorer` evaluates facts using multiple extensible algorithms (e.g., `RequiredQualificationScorer`, `ResponsibilityScorer`, `TitleScorer`).
4. **Optimization**: Facts are sorted by relevance. The `BulletLimiter` and `SectionOrganizer` truncate entries to meet strict WEC length constraints while maintaining chronological flow.
5. **Validation Firewall**: A strict `ResumeValidator` intercepts the final JSON. If a required section is missing, or a bullet lacks a verifiable `evidenceId`, the engine halts.
6. **Load (Renderer)**: Outputs a validated `resume.json` and a professionally styled, letter-sized printable `resume.html`.

## Core Features

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

In strict compliance with the Waterloo Engineering Competition AI policy, we utilized free AI models **exclusively for research purposes**. No generative AI was used to write code, generate text, design slides, or create any project deliverables.

### Disclosed AI Usage (Research Purposes Only)

**1. Algorithmic Research (Jaccard vs. Cosine Similarity)**

- **Specific Prompt Used:** _"Explain the mathematical differences, performance trade-offs, and implementation edge cases between Jaccard similarity and Cosine similarity when comparing two flat sets of extracted text tokens."_
- **Purpose:** To understand the optimal mathematical theory for our `TokenOverlapScorer` without generating the TypeScript implementation itself.
- **Model & Platform:** Claude 3.5 Sonnet (Free tier accessed via Anthropic web interface)

**2. Schema Validation Research (Zod)**

- **Specific Prompt Used:** _"What are the documented limitations of Zod when recursively validating deeply nested array objects in TypeScript, and how does the `safeParse` method handle error aggregation?"_
- **Purpose:** Researching error-handling behaviors for our `CandidateParser` and `SchemaValidator` to ensure our pipeline degrades gracefully when fed malformed JSON.
- **Model & Platform:** Gemini 1.5 Flash (Free tier accessed via Google AI Studio)

**3. HTML Print Rendering Behavior**

- **Specific Prompt Used:** _"What are the standard CSS `@page` directives required to force a modern web browser to print an HTML document strictly as an 8.5x11 US Letter-sized document without cutting off margins?"_
- **Purpose:** Investigating CSS print specifications to ensure our Handlebars template (`resume.hbs`) scales correctly when printed by the judges.
- **Model & Platform:** Claude 3.5 Sonnet (Free tier accessed via Anthropic web interface)

### Environmental Impact Estimation

Based on recent studies, a single AI query consumes approximately 0.33 watt-hours of electricity, emits 0.15 grams of $CO_2$, and evaporates roughly 10 milliliters of fresh water for data center cooling.

Over the course of this weekend, our team executed an estimated **300 research queries**.

- **Carbon Emissions:** ~45 grams of $CO_2$ (Comparable to driving a standard gasoline car for ~0.1 miles).
- **Energy Cost:** 99 watt-hours (0.099 kWh). At an average Ontario grid rate of 14¢/kWh, the total monetary energy cost is **~$0.014 (1.4 cents)**.
- **Water Usage:** ~3,000 milliliters (3 liters) of evaporated fresh water cooling cost.

By strictly prohibiting generative AI for code and deliverables, we kept our query footprint and environmental impact exceptionally low.
