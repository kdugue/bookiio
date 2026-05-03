import { ChromaClient } from "chromadb";
import { embedTexts } from "./gemini.js";

const client = new ChromaClient({
  host: process.env.CHROMA_HOST || "localhost",
  port: parseInt(process.env.CHROMA_PORT || "8000"),
});

async function getCollection(bookId) {
  return client.getOrCreateCollection({
    name: `book-${bookId}`,
    metadata: { "hnsw:space": "cosine" },
  });
}

export async function storeChunks(bookId, chunks, chapterIds = []) {
  const collection = await getCollection(bookId);

  console.log(`[vector] Embedding ${chunks.length} chunks via Gemini...`);
  const embeddings = await embedTexts(chunks);
  console.log(`[vector] Embedding complete, storing in ChromaDB...`);

  const batchSize = 50;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    await collection.add({
      ids: batch.map((_, idx) => `${bookId}-chunk-${i + idx}`),
      documents: batch,
      embeddings: embeddings.slice(i, i + batchSize),
      metadatas: batch.map((_, idx) => ({
        bookId,
        chunkIndex: i + idx,
        chapterId: chapterIds[i + idx] || "whole",
      })),
    });
    console.log(`[vector] Stored batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
  }

  return chunks.length;
}

export async function queryChunks(bookId, queryText, nResults = 5, chapterId = null) {
  const collection = await getCollection(bookId);

  const [queryEmbedding] = await embedTexts([queryText]);

  const queryOpts = {
    queryEmbeddings: [queryEmbedding],
    nResults,
  };

  if (chapterId) {
    queryOpts.where = { chapterId };
  }

  const results = await collection.query(queryOpts);
  return results.documents?.[0] ?? [];
}

export async function deleteCollection(bookId) {
  try {
    await client.deleteCollection({ name: `book-${bookId}` });
  } catch {
    // collection may not exist yet
  }
}
