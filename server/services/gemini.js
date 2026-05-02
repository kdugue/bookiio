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

export default ai;
