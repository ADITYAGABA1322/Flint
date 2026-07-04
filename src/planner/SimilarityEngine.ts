const STOP_WORDS = new Set([
  'the', 'is', 'a', 'on', 'for', 'at', 'to', 'in', 'and', 'of',
  'it', 'that', 'this', 'with', 'we', 'you', 'me', 'i', 'he', 'she',
  'they', 'our', 'are', 'was', 'were', 'be', 'been', 'have', 'has',
  'had', 'do', 'does', 'did', 'but', 'or', 'as', 'if', 'then', 'else'
]);

export function tokenize(text: string): Set<string> {
  const clean = text.toLowerCase().replace(/[^a-z0-9\s]/gi, ' ');
  const words = clean.split(/\s+/).filter(Boolean);
  const result = new Set<string>();
  for (const word of words) {
    if (word.length > 1 && !STOP_WORDS.has(word)) {
      result.add(word);
    }
  }
  return result;
}

export function jaccardSimilarity(textA: string, textB: string): number {
  const setA = tokenize(textA);
  const setB = tokenize(textB);

  if (setA.size === 0 || setB.size === 0) return 0;

  const intersection = new Set<string>();
  for (const item of setA) {
    if (setB.has(item)) {
      intersection.add(item);
    }
  }

  const unionSize = setA.size + setB.size - intersection.size;
  return intersection.size / unionSize;
}
