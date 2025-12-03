import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_MODEL_IMAGE_DESC, API_KEY } from "../constants";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Helper to convert File to Base64
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Uses Gemini to analyze the image and provide a description/enhancement suggestions.
 * This simulates the "Intelligence" part of the upscaler.
 */
export const analyzeImageContent = async (file: File): Promise<string> => {
  try {
    if (!API_KEY) throw new Error("API Key missing");
    
    const imagePart = await fileToGenerativePart(file);
    
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_IMAGE_DESC,
      contents: {
        parts: [
            imagePart,
            { text: "Analyze this image for upscaling. Describe the main subject, lighting, and any noise/blur issues in one concise sentence." }
        ]
      },
    });

    return response.text || "Analysis complete.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "AI analysis unavailable (Check API Key)";
  }
};

/**
 * Simulation of sending media to a backend pipeline.
 * In a real app, this would POST to FastAPI/Python.
 * Here we mock the latency and return the original image as "processed" 
 * (or a slightly modified dummy url if we had one) for the UI demo.
 */
export const mockUpscaleProcess = async (
  file: File, 
  scale: number,
  onProgress: (p: number) => void
): Promise<string> => {
    // Simulate upload
    onProgress(10);
    await new Promise(r => setTimeout(r, 800));
    onProgress(30);
    
    // Simulate processing time based on scale factor
    // Higher scale = longer "AI processing" time
    const baseDelay = 2000;
    const scaleMultiplier = scale === 16 ? 3.0 : scale === 8 ? 2.0 : scale === 4 ? 1.0 : 0.8;
    
    await new Promise(r => setTimeout(r, baseDelay * scaleMultiplier));
    onProgress(70);
    
    // Simulate finishing
    await new Promise(r => setTimeout(r, 800));
    onProgress(100);

    // In a real app, this returns the URL of the S3 bucket item
    return URL.createObjectURL(file);
};