import { GoogleGenerativeAI, type Part } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("VITE_GEMINI_API_KEY is not set in .env");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export interface ChatMessage {
  role: "user" | "model";
  parts: (string | { inlineData: { mimeType: string; data: string } })[];
}

export const sendMessageToGemini = async (history: ChatMessage[], newMessageParts: (string | { inlineData: { mimeType: string; data: string } })[]): Promise<string> => {
  try {
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role,
        parts: msg.parts.map(part => {
          if (typeof part === 'string') return { text: part };
          return part;
        }) as Part[],
      })),
    });

    const result = await chat.sendMessage(newMessageParts.map(part => {
      if (typeof part === 'string') return { text: part };
      return part;
    }));

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
};
