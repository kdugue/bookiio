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
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i++) {
    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: texts[i],
      config: { outputDimensionality: 768 },
    });
    allEmbeddings.push(response.embeddings[0].values);

    if ((i + 1) % 50 === 0 || i === texts.length - 1) {
      console.log(`[embed] ${i + 1}/${texts.length} chunks embedded`);
    }
  }

  return allEmbeddings;
}

export default ai;
