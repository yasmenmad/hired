import fs from "fs";
import path from "path";
import os from "os";
import dotenv from "dotenv";

dotenv.config();

/**
 * Converts a base64 audio buffer to text using Groq's Whisper API.
 * @param {Object} params - The parameters for conversion.
 * @param {Buffer} params.audioData - The raw audio buffer.
 * @param {import("groq-sdk").default} params.groq - The Groq SDK instance.
 * @returns {Promise<string>} - The transcribed text.
 */
export async function convertAudioToText({ audioData, groq }) {
    // Webm is preferred for modern browsers and Groq supports it
    const outputPath = path.join(os.tmpdir(), `voice_interview_${Date.now()}.webm`);
    
    try {
        // Write the incoming buffer to a temporary file
        fs.writeFileSync(outputPath, audioData);
        console.log(`📝 Audio written to temp file: ${outputPath} (${audioData.length} bytes)`);

        // Create transcription request
        // The latest Groq SDK handles fs.createReadStream correctly
        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(outputPath),
            model: "whisper-large-v3",
            response_format: "json",
            language: "en",
            temperature: 0.0, // Lower temperature for more accurate transcription
        });

        const text = transcription.text || "";
        console.log(`🎤 Transcription successful: "${text}"`);
        
        return text;
    } catch (error) {
        console.error("❌ Whisper Transcription error:", error);
        
        // Rethrow for the main handler to catch
        throw new Error(`Speech-to-Text failed: ${error.message}`);
    } finally {
        // Always clean up the temp file
        if (fs.existsSync(outputPath)) {
            try {
                fs.unlinkSync(outputPath);
            } catch (cleanupError) {
                console.error("⚠️ Failed to delete temp audio file:", cleanupError);
            }
        }
    }
}