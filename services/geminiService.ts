
import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import type { ImageItem } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateBackgroundImage = async (prompt: string): Promise<ImageItem> => {
    if (!API_KEY) {
        throw new Error("Gemini API key is not configured.");
    }

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '16:9',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        const dataUrl = `data:image/png;base64,${base64ImageBytes}`;
        return {
            id: uuidv4(),
            name: `${prompt.substring(0, 20)}.png`,
            dataUrl: dataUrl,
            placement: { x: 0.15, y: 0.15, width: 0.7, height: 0.7 },
            logoPlacement: { x: 0.05, y: 0.05, width: 0.2, height: 0.2 },
        };
    } else {
        throw new Error("Image generation failed, no images returned.");
    }
};
