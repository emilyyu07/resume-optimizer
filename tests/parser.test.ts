import { describe, expect, it } from "vitest";

import { CandidateParser } from "../src/parser/CandidateParser";
import { JobParser } from "../src/parser/JobParser";

describe("parsers", () => {
  it("parses candidate and flattens facts", () => {
    const parser = new CandidateParser();
    const result = parser.parse({
      candidate: {
        id: "candidate-1",
        name: "Alex Candidate",
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
    });

    expect(result.candidate.id).toBe("candidate-1");
    expect(result.facts.length).toBeGreaterThan(1);
  });

  it("throws meaningful errors for invalid candidate", () => {
    const parser = new CandidateParser();
    expect(() => parser.parse({ id: "", name: "" })).toThrowError(/Invalid candidate\.json payload/);
  });

  it("parses job payload in object wrapper format", () => {
    const parser = new JobParser();
    const jobs = parser.parse({
      jobs: [
        {
          id: "job-1",
          title: "TypeScript Engineer",
          requiredQualifications: ["TypeScript"],
          preferredQualifications: [],
          responsibilities: ["Build APIs"],
          keywords: []
        }
      ]
    });
    expect(jobs).toHaveLength(1);
    expect(jobs[0]?.keywords.includes("typescript")).toBe(true);
  });

  it("throws on duplicate fact ids", () => {
    const parser = new CandidateParser();
    const input = {
      candidate: {
        id: "candidate-dup",
        name: "Dup",
        skills: [
          { id: "skill-dup", name: "TypeScript" },
          { id: "skill-dup", name: "TypeScript - duplicate" }
        ]
      }
    } as unknown;
    expect(() => parser.parse(input)).toThrowError(/duplicate candidate entity IDs/i);
  });

  it("throws with aggregate duplicate ids across entity groups", () => {
    const parser = new CandidateParser();
    const input = {
      candidate: {
        id: "candidate-dup-2",
        name: "Dup 2",
        experiences: [
          {
            id: "exp-1",
            title: "Software Engineer",
            organization: "Acme",
            start_date: "2022-01-01",
            facts: [{ id: "f1", text: "Built APIs" }]
          },
          {
            id: "exp-1",
            title: "Software Engineer II",
            organization: "Acme",
            start_date: "2023-01-01",
            facts: [{ id: "f2", text: "Built more APIs" }]
          }
        ],
        skills: [
          { id: "skill-1", name: "TypeScript" },
          { id: "skill-1", name: "Node.js" }
        ]
      }
    } as unknown;
    expect(() => parser.parse(input)).toThrowError(/experiences: exp-1; skills: skill-1/i);
  });
});
