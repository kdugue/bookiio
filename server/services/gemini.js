import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function chatCompletion(systemPrompt, userPrompt, { model = "gemini-2.5-flash", temperature = 0.7 } = {}) {
  const response = await ai.models.generateContent({
    model,
    config: { temperature },
    contents: [
      { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
    ],
  });
  return response.text;
}

const DETECT_PROMPT = `You are a book identification assistant. Given a text excerpt from a book, identify the book's title and author.
Return ONLY valid JSON with no markdown formatting: {"title": "...", "author": "..."}
If you cannot determine the title, use your best guess. If you cannot determine the author, use "Unknown".`;

export async function detectBookMetadata(textSample) {
  const raw = await chatCompletion(DETECT_PROMPT, textSample, { temperature: 0.2 });
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```/g, "").trim();
  const result = JSON.parse(cleaned);
  return {
    title: result.title || "Untitled",
    author: result.author || "Unknown",
  };
}

export async function embedTexts(texts) {
  const batchSize = 100;
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((text) =>
        ai.models.embedContent({
          model: "gemini-embedding-001",
          contents: text,
          config: { outputDimensionality: 768 },
        })
      )
    );
    for (const r of results) {
      allEmbeddings.push(r.embeddings[0].values);
    }
    if (i + batchSize < texts.length) {
      console.log(`[embed] Embedded ${Math.min(i + batchSize, texts.length)}/${texts.length} chunks`);
    }
  }

  return allEmbeddings;
}

export default ai;
