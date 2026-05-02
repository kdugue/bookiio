import { extractText, chunkText } from "./ingestion.js";
import { detectChapters, getChapterText } from "./chapters.js";
import { storeChunks, deleteCollection } from "./vector.js";
import { readDb, writeDb } from "./db.js";

export async function ingestBook(bookId) {
  const db = await readDb();
  const book = db.books.find((b) => b.id === bookId);
  if (!book) throw new Error(`Book ${bookId} not found in db`);

  console.log(`[pipeline] Starting ingestion for "${book.title}" (${bookId})`);

  try {
    await deleteCollection(bookId);

    const fullText = await extractText(book.filename);
    console.log(`[pipeline] Extracted ${fullText.length} characters`);

    const chapters = detectChapters(fullText);
    console.log(`[pipeline] Detected ${chapters.length} chapters`);

    const allChunks = [];
    const chapterIds = [];

    if (chapters.length >= 2) {
      for (const ch of chapters) {
        const chText = getChapterText(fullText, ch);
        const chChunks = chunkText(chText);
        for (const chunk of chChunks) {
          allChunks.push(chunk);
          chapterIds.push(ch.id);
        }
      }
    } else {
      const chunks = chunkText(fullText);
      for (const chunk of chunks) {
        allChunks.push(chunk);
        chapterIds.push("whole");
      }
    }

    console.log(`[pipeline] Created ${allChunks.length} chunks across ${chapters.length || 1} chapters`);

    const stored = await storeChunks(bookId, allChunks, chapterIds);
    console.log(`[pipeline] Stored ${stored} chunks in ChromaDB`);

    const freshDb = await readDb();
    const freshBook = freshDb.books.find((b) => b.id === bookId);
    if (freshBook) {
      freshBook.status = "ready";
      freshBook.chunkCount = stored;
      freshBook.ingestedAt = new Date().toISOString();
      freshBook.chapters = chapters.map(({ id, title }) => ({ id, title }));
      await writeDb(freshDb);
    }

    console.log(`[pipeline] Ingestion complete for "${book.title}"`);
    return { bookId, chunkCount: stored, chapters: chapters.length };
  } catch (err) {
    const freshDb = await readDb();
    const freshBook = freshDb.books.find((b) => b.id === bookId);
    if (freshBook) {
      freshBook.status = "error";
      freshBook.error = err.message;
      await writeDb(freshDb);
    }
    throw err;
  }
}
