import type { Candidate } from "../src/models/Candidate";
import type { Fact } from "../src/models/Fact";
import type { JobPosting } from "../src/models/JobPosting";
import type { Resume } from "../src/models/Resume";

export const candidateFixture: Candidate = {
  id: "candidate-1",
  name: "Alex Candidate",
  summary: "Backend engineer with API design and reliability experience.",
  experiences: [
    {
      id: "exp-1",
      title: "Software Engineer",
      company: "Acme",
      startDate: "2022-01-01",
      bullets: [
        "Built TypeScript APIs handling 1M requests per day.",
        "Improved test coverage with Vitest."
      ],
      skills: ["TypeScript", "Node.js"]
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "Resume Optimizer",
      bullets: ["Implemented CLI workflows with evidence tracking."],
      skills: ["TypeScript", "CLI"]
    }
  ],
  certifications: [
    {
      id: "cert-1",
      name: "AWS Developer",
      issuer: "Amazon"
    }
  ],
  education: [
    {
      id: "edu-1",
      institution: "State University",
      degree: "BS",
      field: "Computer Science"
    }
  ],
  skills: [
    {
      id: "skill-1",
      name: "TypeScript"
    },
    {
      id: "skill-2",
      name: "Node.js"
    }
  ]
};

export const factsFixture: readonly Fact[] = [
  {
    id: "experience:exp-1:bullet:0",
    text: "Built TypeScript APIs handling 1M requests per day.",
    sourceType: "experience",
    parentId: "exp-1",
    keywords: ["typescript", "apis", "requests", "day"],
    metadata: {
      sourcePath: "experiences.exp-1.bullets.0",
      sourceField: "bullet",
      sourceSnapshot: "Built TypeScript APIs handling 1M requests per day.",
      title: "Software Engineer",
      company: "Acme"
    },
    score: 0.8,
    evidenceIds: ["experience:exp-1:bullet:0"]
  },
  {
    id: "project:proj-1:bullet:0",
    text: "Implemented CLI workflows with evidence tracking.",
    sourceType: "project",
    parentId: "proj-1",
    keywords: ["implemented", "cli", "evidence", "tracking"],
    metadata: {
      sourcePath: "projects.proj-1.bullets.0",
      sourceField: "bullet",
      sourceSnapshot: "Implemented CLI workflows with evidence tracking.",
      name: "Resume Optimizer"
    },
    score: 0.5,
    evidenceIds: ["project:proj-1:bullet:0"]
  }
];

export const jobPostingFixture: JobPosting = {
  id: "job-1",
  title: "Senior TypeScript Engineer",
  requiredQualifications: ["TypeScript", "API design"],
  preferredQualifications: ["CLI tooling"],
  responsibilities: ["Design reliable backend APIs"],
  keywords: ["typescript", "api", "backend", "reliable", "cli"]
};

export const resumeFixture: Resume = {
  candidateId: "candidate-1",
  jobPostingId: "job-1",
  generatedAt: "2026-01-01T00:00:00.000Z",
  metadata: {
    pageCountEstimate: 1,
    maxBulletsPerSection: 8,
    generatedBy: "resume-optimizer-baseline"
  },
  sections: [
    {
      id: "experience",
      type: "experience" as any,
      title: "Experience",
      entries: [
        {
          id: "experience:exp-1",
          title: "Software Engineer",
          subtitle: "Acme",
          facts: [factsFixture[0]],
          score: 0.8,
          evidenceIds: ["experience:exp-1:bullet:0"]
        }
      ]
    },
    {
      id: "projects",
      type: "projects" as any,
      title: "Projects",
      entries: [
        {
          id: "project:proj-1",
          title: "Resume Optimizer",
          facts: [factsFixture[1]],
          score: 0.5,
          evidenceIds: ["project:proj-1:bullet:0"]
        }
      ]
    },
    {
      id: "summary",
      type: "summary" as any,
      title: "Professional Summary",
      entries: [
        {
          id: "summary:candidate-1",
          title: "candidate-1",
          facts: [
            {
              id: "summary:candidate-1",
              text: "Backend engineer with API design and reliability experience.",
              sourceType: "summary",
              parentId: "candidate-1",
              keywords: ["backend", "engineer", "api", "design", "reliability"],
              metadata: {
                sourcePath: "summary",
                sourceField: "summary",
                sourceSnapshot: "Backend engineer with API design and reliability experience.",
                candidateName: "Alex Candidate"
              },
              score: 0.6,
              evidenceIds: ["summary:candidate-1"]
            }
          ],
          score: 0.6,
          evidenceIds: ["summary:candidate-1"]
        }
      ]
    },
    {
      id: "skills",
      type: "skills" as any,
      title: "Skills",
      entries: [
        {
          id: "skill:skill-1",
          title: "skill-1",
          facts: [
            {
              id: "skill:skill-1",
              text: "TypeScript",
              sourceType: "skill",
              parentId: "skill-1",
              keywords: ["typescript"],
              metadata: {
                sourcePath: "skills.skill-1.name",
                sourceField: "name",
                sourceSnapshot: "TypeScript",
                category: null,
                proficiency: null
              },
              score: 0.5,
              evidenceIds: ["skill:skill-1"]
            }
          ],
          score: 0.5,
          evidenceIds: ["skill:skill-1"]
        }
      ]
    },
    {
      id: "education",
      type: "education" as any,
      title: "Education",
      entries: []
    },
    {
      id: "personal_info",
      type: "personal_info" as any,
      title: "Personal information",
      entries: []
    }
  ]
};