import { GoogleGenAI } from "@google/genai";

// Helper to access key safely
const getApiKey = () => {
  // Try different ways the key might be injected
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  return process.env.API_KEY || '';
};

export const analyzeDataWithGemini = async (prompt: string, contextData: any): Promise<string> => {
  const apiKey = getApiKey();

  if (!apiKey || apiKey === 'YOUR_API_KEY') {
    return "Configuration Error: Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your environment.";
  }

  const ai = new GoogleGenAI({ apiKey });
    
  const contextString = JSON.stringify(contextData);
  const fullPrompt = `
    You are an expert Data Analyst for a loyalty program in DRC (Democratic Republic of Congo).
    Analyze the following JSON data representing sales, user activity, and campaigns:
    ${contextString}

    User Question: ${prompt}

    Provide a concise, professional, and actionable insight. Format using Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });

    return response.text || "No response generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error analyzing data. Please try again later.";
  }
};

export interface ScannedReceiptData {
  merchantName: string;
  totalAmount: number;
  currency: string;
  date: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  confidence: number;
  receiptNumber?: string;
}

export const analyzeReceiptImage = async (base64Image: string): Promise<ScannedReceiptData | null> => {
  const apiKey = getApiKey();
  
  if (!apiKey || apiKey === 'YOUR_API_KEY') {
    console.error("Gemini Key Missing");
    throw new Error("API Key Missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Remove header if present (data:image/jpeg;base64,)
  const cleanBase64 = base64Image.split(',')[1] || base64Image;

  const prompt = `
    Analyze this receipt image. Extract the following details in strict JSON format:
    {
      "merchantName": "Name of the store",
      "totalAmount": 0, (number)
      "currency": "CDF" or "USD",
      "date": "YYYY-MM-DD",
      "receiptNumber": "Unique receipt ID/Invoice number found on receipt",
      "items": [ {"name": "item name", "price": 0, "quantity": 1} ],
      "confidence": 0.0 to 1.0 (how readable is it?)
    }
    If you cannot read it, return confidence 0.
    Do not add markdown blocks like \`\`\`json. Just return the raw JSON string.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Using flash for speed/cost on images
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: prompt }
        ]
      }
    });

    const text = response.text || "";
    // Clean up potential markdown formatting
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanText) as ScannedReceiptData;

  } catch (error) {
    console.error("OCR Error:", error);
    return null;
  }
};
