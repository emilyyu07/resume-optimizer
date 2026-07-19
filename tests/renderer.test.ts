import { describe, expect, it } from "vitest";

import { HtmlRenderer } from "../src/renderer/HtmlRenderer";
import { JsonRenderer } from "../src/renderer/JsonRenderer";
import { resumeFixture } from "./fixtures";

describe("renderers", () => {
  it("renders resume as json", () => {
    const renderer = new JsonRenderer();
    const json = renderer.render(resumeFixture);
    const parsed = JSON.parse(json) as typeof resumeFixture;
    expect(parsed.candidateId).toBe(resumeFixture.candidateId);
    expect(parsed.sections[0]?.entries.length).toBeGreaterThan(0);
  });

  it("renders resume html using handlebars template", () => {
    const renderer = new HtmlRenderer();
    const html = renderer.render(resumeFixture);
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Experience");
    expect(html).toContain("Software Engineer");
  });
});
