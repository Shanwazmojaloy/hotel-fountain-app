
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Executes a fast, low-latency AI task using gemini-1.5-flash
 */
export const fastQuery = async (prompt: string, systemInstruction?: string) => {
  if (!apiKey) return "API Key is missing. Check .env.local";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || "You are an expert hospitality assistant for Hotel Fountain. Be concise, professional, and luxury-oriented.",
        temperature: 0.7,
      },
    });
    return response.text || "AI services temporarily unavailable.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to retrieve AI insights.";
  }
};

/**
 * Executes a more complex analytical task using gemini-1.5-pro
 */
export const analyticalQuery = async (prompt: string, systemInstruction: string) => {
  if (!apiKey) return "API Key is missing. Check .env.local";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });
    return response.text || "Analysis failed.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Complexity error in AI analysis.";
  }
};
