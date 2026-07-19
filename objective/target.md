# PROJECT_SPECIFICATION.md

## Waterloo Engineering Competition – Resume Optimization Engine

### Ultimate Project Specification & Engineering Reference

**Version:** 1.0
**Purpose:** This document serves as the **single source of truth** for the project. Every engineering decision, implementation, and feature should align with the objectives described below.

---

# 1. Project Mission

Build an automated resume optimization engine that tailors a candidate's resume to each job posting while **preserving factual accuracy**.

The system should intelligently determine which experiences, projects, education, certifications, and skills are most relevant to a given job posting and produce:

- A structured JSON resume
- A professionally formatted HTML resume

The generated resume must maximize relevance while remaining completely truthful.

---

# 2. Primary Objectives

The project has five primary objectives, listed in priority order.

## Objective 1 — Maintain Complete Factual Integrity

The application must **never invent, exaggerate, rewrite, or fabricate** information.

Every generated resume bullet must originate directly from candidate-provided information.

The optimization engine may:

- Reorder content
- Select content
- Omit content
- Prioritize content

The optimization engine must **never**:

- Invent achievements
- Change technical skills
- Modify quantified results
- Rewrite experiences into different facts

This is the highest-priority engineering constraint.

---

## Objective 2 — Maximize Job Relevance

Each generated resume should emphasize the candidate information that best aligns with the target job.

Examples include:

- Matching technical skills
- Matching required qualifications
- Matching preferred qualifications
- Matching responsibilities
- Matching technologies
- Matching keywords

The system should surface the strongest evidence demonstrating alignment with the position.

---

## Objective 3 — Generate Valid Deliverables

For every applied job posting, generate:

- `resume.json`
- `resume.html`

Both outputs must represent the exact same resume.

The HTML is a presentation layer only.

The JSON is the authoritative structured representation.

---

## Objective 4 — Handle Hidden Edge Cases

The system should behave correctly for unexpected inputs.

Examples include:

- No experience
- No projects
- No certifications
- Empty skills
- Many experiences
- Duplicate information
- Sparse candidate profiles
- Highly technical job postings
- Non-technical job postings

The application should degrade gracefully without crashing.

---

## Objective 5 — Demonstrate Strong Software Engineering

The architecture should be:

- Modular
- Testable
- Extensible
- Maintainable
- Deterministic

Each subsystem should have one responsibility.

---

# 3. Functional Requirements

The application consists of eight functional stages.

---

## Stage 1 — Parse Input

### Inputs

Candidate profile

Job postings

### Responsibilities

- Read input files
- Validate schema
- Detect malformed data
- Convert into typed objects

### Output

```text
Candidate
JobPosting[]
```

---

## Stage 2 — Normalize Candidate Data

Convert hierarchical candidate information into searchable internal objects.

Examples include:

- Experience bullets
- Project bullets
- Education
- Certifications
- Skills

Each becomes a standardized **Fact** object.

Every Fact should preserve:

- Source
- Parent experience/project
- Metadata
- Evidence identifiers

Output:

```text
Fact[]
```

---

## Stage 3 — Analyze Job Posting

Extract important hiring signals.

Including:

- Required qualifications
- Preferred qualifications
- Responsibilities
- Technologies
- Programming languages
- Keywords
- Action verbs

Output:

```text
JobFeatures
```

---

## Stage 4 — Score Candidate Facts

Every candidate fact receives a relevance score.

Potential scoring dimensions include:

- Keyword overlap
- Skill overlap
- Responsibility overlap
- Title similarity
- Qualification matching

Output:

```text
ScoredFact[]
```

---

## Stage 5 — Optimize Resume

Build the optimal resume by selecting the highest-value facts.

Responsibilities include:

- Ranking content
- Selecting experiences
- Selecting projects
- Ordering sections
- Limiting bullet counts
- Maintaining chronological structure where appropriate

Output:

```text
Resume
```

---

## Stage 6 — Validate Resume

Before generating output, verify:

- Required sections exist
- Evidence references are valid
- Bullet limits are respected
- Output schema is correct
- Resume is internally consistent

No invalid resume should be rendered.

---

## Stage 7 — Render Output

Generate

```text
resume.json
resume.html
```

Both outputs should contain identical information.

The HTML should be:

- Professional
- Readable
- Printable
- Self-contained

---

## Stage 8 — Multi-Posting Generation

Repeat the pipeline for every applied job.

Output:

```text
resume_1.json
resume_1.html

resume_2.json
resume_2.html

...
```

---

# 4. Non-Functional Requirements

The project should satisfy the following engineering qualities.

## Deterministic

The same inputs should always produce the same outputs.

No randomness.

---

## Modular

Every subsystem should have one responsibility.

Suggested modules include:

- Parser
- Models
- Ranking
- Optimizer
- Renderer
- Validator
- Utilities

---

## Extensible

Future improvements should require minimal changes.

New ranking algorithms should be swappable without affecting rendering.

---

## Testable

Every subsystem should be independently testable.

Unit tests should cover:

- Parsing
- Ranking
- Optimization
- Rendering
- Validation

---

## Robust

Handle malformed or incomplete data gracefully.

The application should never crash due to missing optional fields.

---

# 5. Architectural Principles

The system should follow a linear pipeline:

```text
Input
    ↓
Parsing
    ↓
Normalization
    ↓
Job Analysis
    ↓
Ranking
    ↓
Optimization
    ↓
Validation
    ↓
Rendering
    ↓
Output
```

Each stage should operate independently.

---

# 6. Data Flow

```text
candidate.json
job_postings.json
        │
        ▼
Parser
        │
        ▼
Candidate Model
Job Models
        │
        ▼
Fact Extraction
        │
        ▼
Fact Collection
        │
        ▼
Job Analysis
        │
        ▼
Ranking
        │
        ▼
Resume Optimizer
        │
        ▼
Resume Model
        │
        ▼
Validation
        │
        ▼
JSON Renderer
HTML Renderer
```

---

# 7. Core Data Model

The application should revolve around one central abstraction:

## Fact

Every searchable piece of candidate information becomes a Fact.

Example:

Experience:

```
Programming Intern

Built backend API.
```

↓

```
Fact
```

Projects, education, certifications, and skills should follow the same representation.

This allows the ranking engine to evaluate all candidate information uniformly.

---

# 8. Ranking Philosophy

The system should optimize by **selection**, not **generation**.

The optimizer should answer:

> "Which existing facts best demonstrate that this candidate matches this job?"

It should never answer:

> "How can we rewrite the candidate to sound better?"

---

# 9. Validation Philosophy

Validation is the final quality gate.

Every generated resume should pass checks for:

- Valid evidence references
- Required sections
- Maximum bullet counts
- Output schema
- Internal consistency

Validation should occur before any files are written.

---

# 10. Hidden Case Strategy

The application should gracefully support:

- Empty experiences
- Empty projects
- Missing certifications
- Empty skills
- Large candidate profiles
- Duplicate information
- Jobs with few keywords
- Jobs with many keywords
- Technical positions
- Non-technical positions

No assumptions should be hardcoded.

---

# 11. Engineering Standards

The codebase should emphasize:

- Clean architecture
- Strong typing
- Small, focused classes
- Reusable interfaces
- Dependency inversion where appropriate
- Clear naming
- Comprehensive documentation
- Consistent formatting

---

# 12. Definition of Success

The project is complete when it can:

- Parse every provided input.
- Correctly identify the most relevant candidate information.
- Generate one optimized resume for every job application.
- Produce valid JSON and HTML outputs.
- Preserve factual integrity throughout the pipeline.
- Pass validation without errors.
- Handle hidden edge cases gracefully.
- Be easily maintained and extended.

---

# 13. Guiding Engineering Principles

Before implementing any feature, every engineer should ask:

1. Does this preserve factual accuracy?
2. Does this improve relevance to the target job?
3. Is this deterministic?
4. Can this be tested independently?
5. Does this belong in the current module, or should it be its own subsystem?
6. Will this design make future improvements easier?

If the answer to any of these questions is "no", reconsider the implementation.

---

# 14. Ultimate Goal

The objective is **not** simply to generate resumes.

The objective is to engineer a **robust, scalable, modular resume optimization platform** that can:

- Understand candidate information.
- Understand employer requirements.
- Intelligently connect the two.
- Produce truthful, optimized resumes automatically.
- Demonstrate sound software engineering principles suitable for evaluation by technical judges.

This document should be treated as the project's authoritative engineering specification. All implementation decisions, architectural choices, and feature additions should align with the principles and objectives described herein.
