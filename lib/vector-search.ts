/**
 * Computes the Cosine Similarity between two numerical vectors.
 * Formula: A . B / (||A|| * ||B||)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error(`Vector length mismatch: ${vecA.length} vs ${vecB.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const magnitudeA = Math.sqrt(normA);
  const magnitudeB = Math.sqrt(normB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0; // prevent division by zero
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Searches and ranks document chunks based on cosine similarity score.
 * Returns the top K chunks that satisfy a minimum similarity threshold.
 */
export interface ScoredChunk {
  text: string;
  sourceDocumentTitle: string;
  score: number;
}

export function searchVectors(
  queryVector: number[],
  chunks: { text: string; embedding: number[]; sourceDocumentTitle: string }[],
  topK: number = 4,
  minThreshold: number = 0.60
): ScoredChunk[] {
  const scored = chunks
    .map((chunk) => {
      try {
        const score = cosineSimilarity(queryVector, chunk.embedding);
        return {
          text: chunk.text,
          sourceDocumentTitle: chunk.sourceDocumentTitle,
          score
        };
      } catch (err) {
        return {
          text: chunk.text,
          sourceDocumentTitle: chunk.sourceDocumentTitle,
          score: 0
        };
      }
    })
    .filter((item) => item.score >= minThreshold)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}
