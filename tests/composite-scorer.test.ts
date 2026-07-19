import { describe, expect, it } from "vitest";

import { CompositeScorer } from "../src/ranking/CompositeScorer";
import type { IScorer } from "../src/ranking/interfaces/IScorer";
import { factsFixture, jobPostingFixture } from "./fixtures";

class ConstantScorer implements IScorer {
  readonly id: string;
  private readonly constant: number;

  constructor(id: string, constant: number) {
    this.id = id;
    this.constant = constant;
  }

  score(): number {
    return this.constant;
  }

  diagnostics() {
    return {
      scorerId: this.id,
      score: this.constant,
      details: {}
    };
  }
}

describe("CompositeScorer", () => {
  it("combines weighted scores", () => {
    const scorer = new CompositeScorer({
      scorers: [new ConstantScorer("a", 1), new ConstantScorer("b", 0)],
      weights: { a: 3, b: 1 }
    });

    const result = scorer.score(factsFixture[0], jobPostingFixture);
    expect(result).toBe(0.75);
  });
});
