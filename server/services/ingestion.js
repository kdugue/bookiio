import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pdfParse from "pdf-parse/lib/pdf-parse.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

export async function extractText(filename) {
  const filepath = path.join(UPLOADS_DIR, filename);
  const ext = path.extname(filename).toLowerCase();

  if (ext === ".txt") {
    return fs.readFile(filepath, "utf-8");
  }

  const buffer = await fs.readFile(filepath);
  const { text } = await pdfParse(buffer);
  return text;
}

export function chunkText(text, { chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP } = {}) {
  const chunks = [];
  const len = text.length;
  let start = 0;

  while (start < len) {
    const end = Math.min(start + chunkSize, len);
    const chunk = text.substring(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    if (end >= len) break;
    start = end - overlap;
  }

  return chunks;
}

export async function parseAndChunk(filename) {
  console.log(`[ingestion] Extracting text from "${filename}"...`);
  const text = await extractText(filename);
  console.log(`[ingestion] Extracted ${text.length} characters, chunking...`);
  const chunks = chunkText(text);
  console.log(`[ingestion] Created ${chunks.length} chunks`);
  return chunks;
}
