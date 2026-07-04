import { describe, it, expect } from 'vitest';
import { tokenize, jaccardSimilarity } from '../src/planner/SimilarityEngine';

describe('SimilarityEngine', () => {
  it('should tokenize and filter stop words', () => {
    const tokens = tokenize("The checkout is failing on iOS with a crash!");
    expect(tokens.has("checkout")).toBe(true);
    expect(tokens.has("failing")).toBe(true);
    expect(tokens.has("ios")).toBe(true);
    expect(tokens.has("crash")).toBe(true);
    expect(tokens.has("the")).toBe(false);
    expect(tokens.has("on")).toBe(false);
    expect(tokens.has("with")).toBe(false);
  });

  it('should calculate correct Jaccard similarity', () => {
    const text1 = "gateway crash during payment checkout";
    const text2 = "payment gateway crash";
    const similarity = jaccardSimilarity(text1, text2);
    expect(similarity).toBeCloseTo(0.6);
  });

  it('should return 0 if one text is empty', () => {
    expect(jaccardSimilarity("", "something")).toBe(0);
  });
});
