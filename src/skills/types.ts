export interface SkillDefinition {
  id: string;
  role: string;
  description: string;
  usage: string;
}

export interface SkillInput {
  id: string;
  args?: string[];
}
