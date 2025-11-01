import { GoogleGenAI, Modality } from "@google/genai";

const TTS_MODEL = "gemini-2.5-flash-preview-tts";

// Define the available voice names for type safety.
export type TtsVoice = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export const generateSpeech = async (text: string, voiceName: TtsVoice = 'Zephyr'): Promise<{ data: string; mimeType: string; } | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.[0];
    // FIX: The type from the SDK for `inlineData` has an optional `data` property,
    // which is incompatible with this function's explicit return type.
    // This ensures `data` exists and returns an object that matches the required type.
    if (audioPart?.inlineData?.data) {
      // Return the full inlineData object which includes { data, mimeType }
      return {
        data: audioPart.inlineData.data,
        mimeType: audioPart.inlineData.mimeType,
      };
    }
    return null;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error("Failed to generate speech from API.");
  }
};
