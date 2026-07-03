import { describe, it, expect } from 'vitest';
import { cosineSimilarity, searchVectors } from '@/lib/vector-search';

describe('Vector Cosine Similarity Mathematics', () => {
  it('should return 1 for identical vectors', () => {
    const vecA = [1, 0, 1, 0.5];
    const vecB = [1, 0, 1, 0.5];
    const similarity = cosineSimilarity(vecA, vecB);
    expect(similarity).toBeCloseTo(1, 5);
  });

  it('should return 0 for orthogonal vectors', () => {
    const vecA = [1, 0];
    const vecB = [0, 1];
    const similarity = cosineSimilarity(vecA, vecB);
    expect(similarity).toBe(0);
  });

  it('should return -1 for opposite vectors', () => {
    const vecA = [1, -1];
    const vecB = [-1, 1];
    const similarity = cosineSimilarity(vecA, vecB);
    expect(similarity).toBeCloseTo(-1, 5);
  });

  it('should rank vector chunks correctly based on proximity', () => {
    const queryVector = [1, 0];
    const mockChunks = [
      { text: 'Irrelevant rule', embedding: [0, 1], sourceDocumentTitle: 'Manual' },
      { text: 'Relevant rule', embedding: [0.95, 0.1], sourceDocumentTitle: 'Manual' },
      { text: 'Semi-relevant rule', embedding: [0.7, 0.5], sourceDocumentTitle: 'Manual' }
    ];

    const results = searchVectors(queryVector, mockChunks, 2, 0.5);
    expect(results.length).toBe(2);
    expect(results[0].text).toBe('Relevant rule');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });
});
