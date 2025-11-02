import { GoogleGenAI, Modality } from "@google/genai";

const TTS_MODEL = "gemini-2.5-flash-preview-tts";

// Define the available voice names for type safety.
export type TtsVoice = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export const generateSpeech = async (text: string, voiceName: TtsVoice = 'Zephyr'): Promise<{ data: string; mimeType: string; } | null> => {
  try {
    // Instantiate client right before the call to use the latest key
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
    if (audioPart?.inlineData?.data) {
      return {
        data: audioPart.inlineData.data,
        mimeType: audioPart.inlineData.mimeType,
      };
    }
    return null;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};
