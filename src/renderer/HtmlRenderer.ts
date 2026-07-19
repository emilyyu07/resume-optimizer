import fs from "node:fs";
import path from "node:path";

import Handlebars from "handlebars";

import type { Resume } from "../models/Resume";

function resolveDefaultTemplatePath(): string {
  const srcTemplate = path.resolve(process.cwd(), "src/renderer/templates/resume.hbs");
  if (fs.existsSync(srcTemplate)) {
    return srcTemplate;
  }
  return path.resolve(__dirname, "templates/resume.hbs");
}

/**
 * Renders resume models into HTML via Handlebars templates.
 */
export class HtmlRenderer {
  // TODO: Add support for swappable template themes and print profile options.
  private readonly template: HandlebarsTemplateDelegate;

  constructor(templatePath = resolveDefaultTemplatePath()) {
    const templateContent = fs.readFileSync(templatePath, "utf-8");
    this.template = Handlebars.compile(templateContent);
  }

  render(resume: Resume): string {
    const viewModel = {
      candidateId: resume.candidateId,
      jobPostingId: resume.jobPostingId,
      generatedAt: resume.generatedAt,
      metadata: resume.metadata,
      sections: resume.sections.map((section) => ({
        title: section.title,
        entries: section.entries.map((entry) => ({
          title: entry.title,
          subtitle: entry.subtitle,
          facts: entry.facts.map((fact) => ({
            text: fact.text,
            score: fact.score
          }))
        }))
      }))
    };
    return this.template(viewModel);
  }
}
