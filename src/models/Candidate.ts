export interface Experience {
  readonly id: string;
  readonly title: string;
  readonly company: string;
  readonly startDate: string;
  readonly endDate?: string;
  readonly summary?: string;
  readonly bullets: readonly string[];
  readonly skills: readonly string[];
}

export interface Project {
  readonly id: string;
  readonly name: string;
  readonly summary?: string;
  readonly bullets: readonly string[];
  readonly skills: readonly string[];
}

export interface Certification {
  readonly id: string;
  readonly name: string;
  readonly issuer: string;
  readonly date?: string;
}

export interface Education {
  readonly id: string;
  readonly institution: string;
  readonly degree: string;
  readonly field?: string;
  readonly startDate?: string;
  readonly endDate?: string;
}

export interface Skill {
  readonly id: string;
  readonly name: string;
  readonly category?: string;
  readonly proficiency?: string;
}

export interface Candidate {
  readonly id: string;
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly summary?: string;
  readonly experiences: readonly Experience[];
  readonly projects: readonly Project[];
  readonly certifications: readonly Certification[];
  readonly education: readonly Education[];
  readonly skills: readonly Skill[];
}
