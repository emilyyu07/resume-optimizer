import { tokenize } from "./tokenizer";

export function extractKeywords(input: string, limit = 12): readonly string[] {
  const tokens = tokenize(input);
  const unique = new Set<string>();
  for (const token of tokens) {
    unique.add(token);
    if (unique.size >= limit) {
      break;
    }
  }
  return [...unique];
}
