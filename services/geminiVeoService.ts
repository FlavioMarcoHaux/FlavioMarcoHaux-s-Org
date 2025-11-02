
import { GoogleGenAI } from "@google/genai";

const VIDEO_MODEL = 'veo-3.1-fast-generate-preview';

/**
 * Generates a video based on a user prompt using the Veo model.
 * This is a long-running operation.
 * @param prompt The user's text prompt describing the video.
 * @returns A promise that resolves to the download link for the generated video, including the API key.
 */
export const generateVideo = async (prompt: string): Promise<string> => {
    // A new GoogleGenAI instance should be created right before making an API call
    // to ensure it always uses the most up-to-date API key from the dialog.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        let operation = await ai.models.generateVideos({
            model: VIDEO_MODEL,
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        // Poll for the result
        while (!operation.done) {
            // Wait for 10 seconds before polling again
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }
        
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

        if (downloadLink) {
             // The response.body contains the MP4 bytes. You must append an API key when fetching from the download link.
            return `${downloadLink}&key=${process.env.API_KEY}`;
        } else {
            console.error("Video generation finished, but no download link was found.", operation);
            throw new Error("Video generation completed, but no video URI was returned.");
        }

    } catch (error) {
        console.error("Error generating video with Veo:", error);
        throw error;
    }
};

/**
 * Fetches the video data from a download link.
 * @param downloadLink The full URL to the video file, including the API key.
 * @returns A promise that resolves to a Blob of the video data.
 */
export const fetchVideo = async (downloadLink: string): Promise<Blob> => {
    try {
        const response = await fetch(downloadLink);
        if (!response.ok) {
            throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
        }
        return await response.blob();
    } catch (error) {
        console.error("Error fetching video data:", error);
        throw new Error("Failed to download the generated video.");
    }
}