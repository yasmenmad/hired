import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import Groq from "groq-sdk";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { convertAudioToText } from "./modules/whisper.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env") });

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
const port = 3000;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Raw data about the job position
const JOB_INFO = `
Role: Senior Frontend Developer
Department: Engineering
Key Skills Required: React.js, JavaScript, UI/UX principles, modern CSS.
Experience Level: 3-5 years.
Responsibilities: Develop robust UI components, collaborate with product teams, problem-solving in a fast-paced environment.
`;

const SYSTEM_PROMPT = `
You are Sara, the Human Resources Manager conducting an official job interview.
You are interviewing the candidate for the following specific role:
<job_position_info>
${JOB_INFO}
</job_position_info>

STRICT INTERVIEW STRUCTURE TO FOLLOW:
Stage 1 (Introduction): ONLY IF this is the very first turn of the interview, introduce yourself briefly (e.g., "Hello, I am Sara from HR.") and ask the candidate to introduce themselves. 
Stage 2 (Background Context): Ask about their background, their current/past roles, and how their past aligns with the position.
Stage 3 (Technical Deep Dive): Ask challenging, specific technical questions directly related to the key skills required in the <job_position_info>.
Stage 4 (Conclusion): Wrap up the interview, ask if they have questions, and conclude.

EMOTIONAL INTELLIGENCE RULES (CRITICAL):
- You have access to the candidate's real-time emotional state via the 'emotion' tag.
- If they are 'Stressed', offer subtle encouragement (e.g., "I notice you're thinking hard, take your time.") or a warmer tone.
- If they are 'Confident', keep the pace professional and dive deeper into challenging questions.
- If they are 'Engaged', acknowledge their passion for the topic.
- Be subtle. Do not sound like an AI analyzer; sound like an empathetic human HR professional who "reads the room".

CRITICAL RULES:
1. YOU ARE A REAL HR RECRUITER, not an AI assistant. Do not "assist", do not offer to "help". You evaluate the candidate.
2. NEVER introduce yourself again after the first interaction. Check the conversation history. If you have already introduced yourself, DO NOT say "I am Sara" again.
3. You MUST DIRECT the interview. Ask exactly ONE clear, targeted interview question at a time. Never overwhelm them with multiple questions at once.
4. Base your follow-up questions organically on their previous answers. Drill into their experience like a real human HR professional.

You must ALWAYS respond with a valid JSON object in exactly this format, with no extra text:
{
  "messages": [
    {
      "text": "your spoken text here",
      "facialExpression": "smile",
      "animation": "talking1"
    }
  ]
}
Facial expressions: smile, sad, angry, surprised, funnyFace, default.
Animations: idle1, idle2, idle3, welcoming, byby, angryy, agree, soagree, Clapping, Typing, sittingtalking, asking, disagree, talking1, talking2.
Return ONLY the raw JSON object. No Markdown, no backticks, no explanations.
`;

let chatHistory = [];

const getAIResponse = async (userMessage, currentEmotion = 'Neutral') => {
    // Treat 'reset' or 'restart' as a command to clear history for testing convenience
    if (userMessage.trim().toLowerCase() === "reset" || userMessage.trim().toLowerCase() === "restart") {
        chatHistory = [];
        return {
            messages: [{ text: "Interview session has been reset. You may start again.", facialExpression: "default", animation: "idle1" }]
        };
    }

    // Append emotion context if provided
    const userContent = currentEmotion !== 'Neutral' 
        ? `[Candidate State: ${currentEmotion}] ${userMessage}`
        : userMessage;

    chatHistory.push({ role: "user", content: userContent });

    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...chatHistory
        ],
        temperature: 0.7,
        max_tokens: 1024,
    });

    const content = completion.choices[0].message.content.trim();
    console.log(" Raw AI response:", content);
    
    const cleaned = content.replace(/```json|```/g, "").trim();
    let parsedResponse = null;
    let spokenText = content; // Fallback text

    try {
        parsedResponse = JSON.parse(cleaned);
        if (parsedResponse && parsedResponse.messages && parsedResponse.messages.length > 0) {
            spokenText = parsedResponse.messages.map(m => m.text).join(" ");
        }
    } catch (e) {
        console.error(" Failed to parse AI response:", cleaned);
        parsedResponse = {
            messages: [{ text: "I'm sorry, I had trouble evaluating that. Let's move on. Could you tell me more about your previous work?", facialExpression: "sad", animation: "idle1" }]
        };
        spokenText = parsedResponse.messages[0].text;
    }

    // Store ONLY the plain English spoken text in history so the model understands exactly what it already said!
    chatHistory.push({ role: "assistant", content: spokenText });

    // Ensure array doesn't grow infinitely (keep last 30 turns)
    if (chatHistory.length > 60) {
        chatHistory = chatHistory.slice(-60);
    }

    return parsedResponse;
};

const buildMessages = async (aiResponse) => {
    return aiResponse.messages.map((msg) => ({
        ...msg,
        audio: null,
        lipsync: { mouthCues: [] },
    }));
};

app.get("/", (req, res) => {
    res.send({ status: "Sara HR backend is running!" });
});

app.post("/tts", async (req, res) => {
    const userMessage = req.body.message;
    const currentEmotion = req.body.emotion || 'Neutral';
    if (!userMessage) return res.status(400).json({ error: "No message provided" });

    try {
        const aiResponse = await getAIResponse(userMessage, currentEmotion);
        const messages = await buildMessages(aiResponse);
        res.json({ messages });
    } catch (error) {
        console.error(" /tts error:", error);
        res.status(500).json({ error: "Failed to process request." });
    }
});

app.post("/sts", async (req, res) => {
    const base64Audio = req.body.audio;
    const currentEmotion = req.body.emotion || 'Neutral';
    if (!base64Audio) return res.status(400).json({ error: "No audio provided" });

    try {
        const audioData = Buffer.from(base64Audio, "base64");
        const userMessage = await convertAudioToText({ audioData, groq });
        console.log(` Transcribed [${currentEmotion}]:`, userMessage);

        const aiResponse = await getAIResponse(userMessage, currentEmotion);
        const messages = await buildMessages(aiResponse);
        res.json({ messages });
    } catch (error) {
        console.error(" /sts error:", error);
        res.status(500).json({ error: "Failed to process request." });
    }
});

app.listen(port, () => {
    console.log(` Sara is listening on port ${port}`);
});