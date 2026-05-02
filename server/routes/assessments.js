import { Router } from "express";
import { generateAssessment, analyzeWrongAnswers } from "../services/assessment.js";

const router = Router();

router.post("/generate", async (req, res) => {
  const { bookId, type = "mcq", count = 5, chapterId = null } = req.body;

  if (!bookId) return res.status(400).json({ error: "bookId is required" });

  try {
    const result = await generateAssessment(bookId, { type, count, chapterId });
    res.json(result);
  } catch (err) {
    console.error("[assessments] Generation failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/analyze", async (req, res) => {
  const { bookId, wrongAnswers } = req.body;

  if (!bookId || !wrongAnswers?.length) {
    return res.status(400).json({ error: "bookId and wrongAnswers are required" });
  }

  try {
    const analyses = await analyzeWrongAnswers(bookId, wrongAnswers);
    res.json({ bookId, analyses });
  } catch (err) {
    console.error("[assessments] Analysis failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
