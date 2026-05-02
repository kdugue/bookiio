import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { v4 as uuid } from "uuid";
import { readDb, writeDb } from "../services/db.js";
import { ingestBook } from "../services/pipeline.js";
import { detectBookMetadata } from "../services/gemini.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

const router = Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ext === ".pdf" || ext === ".txt");
  },
});

router.get("/", async (_req, res) => {
  const db = await readDb();
  res.json(db.books);
});

router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err && err.code === "LIMIT_FILE_SIZE")
      return res.status(413).json({ error: "File exceeds 5 MB limit" });
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "A PDF or TXT file is required" });

  const fallbackTitle = path.parse(req.file.originalname).name;
  let detectedTitle = fallbackTitle;
  let detectedAuthor = "Unknown";

  try {
    const filepath = path.join(UPLOADS_DIR, req.file.filename);
    const raw = await fs.readFile(filepath, "utf-8");
    const sample = raw.substring(0, 2000);
    const meta = await detectBookMetadata(sample);
    detectedTitle = meta.title;
    detectedAuthor = meta.author;
    console.log(`[upload] Detected: "${detectedTitle}" by ${detectedAuthor}`);
  } catch (err) {
    console.error("[upload] Metadata detection failed, using filename:", err.message);
  }

  const db = await readDb();
  const book = {
    id: uuid(),
    title: detectedTitle,
    author: detectedAuthor,
    filename: req.file.filename,
    status: "pending_review",
    source: "user_upload",
    addedAt: new Date().toISOString(),
  };

  db.books.push(book);
  await writeDb(db);

  res.status(201).json(book);
});

router.patch("/:bookId", async (req, res) => {
  const { bookId } = req.params;
  const { title, author } = req.body;
  const db = await readDb();
  const book = db.books.find((b) => b.id === bookId);
  if (!book) return res.status(404).json({ error: "Book not found" });

  if (title) book.title = title;
  if (author) book.author = author;
  book.status = "processing";
  await writeDb(db);

  ingestBook(bookId).catch((err) =>
    console.error(`Ingestion failed for ${bookId}:`, err)
  );

  res.json(book);
});

router.delete("/:bookId", async (req, res) => {
  const { bookId } = req.params;
  const db = await readDb();
  const idx = db.books.findIndex((b) => b.id === bookId);
  if (idx === -1) return res.status(404).json({ error: "Book not found" });

  const [removed] = db.books.splice(idx, 1);
  await writeDb(db);

  try {
    await fs.unlink(path.join(UPLOADS_DIR, removed.filename));
  } catch { /* file may not exist */ }

  res.json({ message: "Book deleted", bookId });
});

router.post("/:bookId/ingest", async (req, res) => {
  const { bookId } = req.params;
  const db = await readDb();
  const book = db.books.find((b) => b.id === bookId);
  if (!book) return res.status(404).json({ error: "Book not found" });

  book.status = "processing";
  await writeDb(db);

  ingestBook(bookId).catch((err) =>
    console.error(`Ingestion failed for ${bookId}:`, err)
  );

  res.json({ message: "Ingestion started", bookId });
});

export default router;
