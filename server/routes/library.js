import { Router } from "express";
import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";
import { readDb, writeDb } from "../services/db.js";
import { ingestBook } from "../services/pipeline.js";

const router = Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ext === ".pdf" || ext === ".txt");
  },
});

router.get("/", async (_req, res) => {
  const db = await readDb();
  res.json(db.books);
});

router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "A PDF file is required" });

  const db = await readDb();
  const book = {
    id: uuid(),
    title: req.body.title || path.parse(req.file.originalname).name,
    author: req.body.author || "Unknown",
    filename: req.file.filename,
    status: "processing",
    source: "user_upload",
    addedAt: new Date().toISOString(),
  };

  db.books.push(book);
  await writeDb(db);

  // Fire-and-forget ingestion; status updates happen inside pipeline
  ingestBook(book.id).catch((err) =>
    console.error(`Ingestion failed for ${book.id}:`, err)
  );

  res.status(201).json(book);
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
