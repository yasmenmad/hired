import dotenv from "dotenv";
dotenv.config();

export const textToSpeech = async (text) => {
  const voiceId = process.env.ELEVEN_LABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVEN_LABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!response.ok) {
    console.warn("⚠️ ElevenLabs failed:", await response.text());
    return null;
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  return audioBuffer;
};