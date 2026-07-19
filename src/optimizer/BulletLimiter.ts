import type { ResumeEntry } from "../models/Entry"; 
import type { ResumeSection } from "../models/Section"; 


export interface BulletLimiterOptions {
  readonly maxFactsPerEntry: number; 
  readonly maxBulletsPerSection: number; 
}

export class BulletLimiter { // Exports the class for use in the pipeline.
  
  limit(
    sections: readonly ResumeSection[], // accepts the fully organized sections.
    options: BulletLimiterOptions // accepts the limits.
  ): readonly ResumeSection[] {
    return sections.map((section) => { // Maps over each section to process them independently.
      let sectionBulletCount = 0; // counter to track vertical height across the entire section.
      const limitedEntries: ResumeEntry[] = []; // Prepares an array to hold the truncated entries.

      // **** WEC CONSTRAINT: We must identify if this is a work or project section because the strict 4-bullet rule applies here.
      const isWorkOrProject = section.type === "experience" || section.type === "projects";

      for (const entry of section.entries) { 
        if (sectionBulletCount >= options.maxBulletsPerSection) { 
          break;
        }

        const remaining = options.maxBulletsPerSection - sectionBulletCount; // Calculates how many slots are left in the section budget.
        
        const WEC_MAX_BULLETS = 4; // competition rule penalty threshold
        // If it's a job, choose the smaller number between the config limit and the WEC hard rule. Otherwise, just use config.
        const entryMax = isWorkOrProject ? Math.min(options.maxFactsPerEntry, WEC_MAX_BULLETS) : options.maxFactsPerEntry;
        
        const allowed = Math.min(entryMax, remaining); // take the smaller of the entry max or the remaining section budget.
        
        const limitedFacts = entry.facts.slice(0, allowed); 
        sectionBulletCount += limitedFacts.length; 

        limitedEntries.push({ // Pushes the newly truncated entry to our safe array.
          ...entry, // title, subtitle, id, etc.
          facts: limitedFacts, // Overwrites the facts array with shortened version.
          evidenceIds: [...new Set(limitedFacts.flatMap((fact) => fact.evidenceIds))] // Recalculates the evidence IDs so doesn't declare IDs for facts just deleted.
        });
      }

      return { 
        ...section, 
        entries: limitedEntries
      };
    });
  }
}