import { queryChunks } from "./vector.js";
import { chatCompletion } from "./gemini.js";
import { readDb, writeDb } from "./db.js";

const SYSTEM_PROMPT = `You are a quiz generator for an educational reading app. You create questions based STRICTLY on the provided book excerpts. Never use outside knowledge.

Return valid JSON matching this exact schema — no markdown fences, no extra text:
{
  "questions": [
    {
      "id": "q1",
      "type": "mcq" | "tf",
      "question": "string",
      "options": ["A", "B", "C", "D"] (4 for mcq, ["True", "False"] for tf),
      "correctIndex": 0,
      "explanation": "Brief explanation citing the text"
    }
  ]
}`;

function buildUserPrompt(chunks, type, count) {
  const context = chunks.map((c, i) => `[Excerpt ${i + 1}]\n${c}`).join("\n\n");
  const qType = type === "tf" ? "True/False" : "Multiple Choice";

  return `Based on the following book excerpts, generate ${count} ${qType} questions.

${context}

Generate exactly ${count} ${qType} questions. Each question must be answerable from the excerpts above. Return only the JSON object.`;
}

export async function generateAssessment(bookId, { type = "mcq", count = 5, chapterId = null } = {}) {
  const cacheKey = `${bookId}:${type}:${count}:${chapterId || "whole"}`;
  const db = await readDb();

  if (db.quizCache[cacheKey]) {
    console.log(`[assessment] Cache hit for ${cacheKey}`);
    return db.quizCache[cacheKey];
  }

  const queryPrompt = type === "tf"
    ? "important facts, claims, and statements from this book"
    : "key concepts, arguments, and details from this book";

  const chunks = await queryChunks(bookId, queryPrompt, 5, chapterId);
  if (chunks.length === 0) {
    throw new Error("No chunks found — has this book been ingested?");
  }

  console.log(`[assessment] Retrieved ${chunks.length} chunks, generating ${type} quiz...`);

  const userPrompt = buildUserPrompt(chunks, type, count);
  const raw = await chatCompletion(SYSTEM_PROMPT, userPrompt, { temperature: 0.5 });

  let parsed;
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse LLM response as JSON: ${raw.substring(0, 200)}`);
  }

  const result = {
    bookId,
    type,
    generatedAt: new Date().toISOString(),
    questions: parsed.questions,
  };

  db.quizCache[cacheKey] = result;
  await writeDb(db);
  console.log(`[assessment] Cached ${parsed.questions.length} questions for ${cacheKey}`);

  return result;
}

const ANALYSIS_PROMPT = `You are an educational tutor for a reading assessment app. The student answered quiz questions incorrectly. Using ONLY the provided book excerpts, explain why each wrong answer is incorrect and why the correct answer is right. Be specific — cite or paraphrase the text.

Return valid JSON matching this exact schema — no markdown fences, no extra text:
{
  "analyses": [
    {
      "questionId": "q1",
      "whyWrong": "Explanation of why the student's chosen answer is incorrect, citing the text",
      "whyRight": "Explanation of the correct answer, citing the text",
      "relevantPassage": "A brief direct quote or close paraphrase from the book"
    }
  ]
}`;

export async function analyzeWrongAnswers(bookId, wrongAnswers) {
  const questions = wrongAnswers.map((wa) =>
    `Question: ${wa.question}\nStudent answered: "${wa.userAnswer}"\nCorrect answer: "${wa.correctAnswer}"`
  ).join("\n\n");

  const chunks = await queryChunks(bookId, questions, 5);
  if (chunks.length === 0) {
    throw new Error("No chunks found — has this book been ingested?");
  }

  const context = chunks.map((c, i) => `[Excerpt ${i + 1}]\n${c}`).join("\n\n");

  const userPrompt = `Here are the questions the student got wrong:\n\n${questions}\n\nHere are relevant excerpts from the book:\n\n${context}\n\nProvide analysis for each wrong answer. Return only the JSON object.`;

  console.log(`[assessment] Analyzing ${wrongAnswers.length} wrong answers...`);
  const raw = await chatCompletion(ANALYSIS_PROMPT, userPrompt, { temperature: 0.3 });

  let parsed;
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse analysis response: ${raw.substring(0, 200)}`);
  }

  return parsed.analyses;
}
