export function jaccardSimilarity(
  leftTokens: readonly string[],
  rightTokens: readonly string[]
): number {
  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return 0;
  }

  const left = new Set(leftTokens);
  const right = new Set(rightTokens);
  const intersectionCount = [...left].filter((token) => right.has(token)).length;
  const unionCount = new Set([...left, ...right]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}
