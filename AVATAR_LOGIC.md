# Hired. — AI Avatar Logic: Deep Dive (Expert Version)

This document provides an exhaustive technical analysis of the **AI Avatar Engine**, the most advanced component of the **Hired.** platform. It explains the real-time audio processing, AI persona logic, and 3D rendering synchronization.

---

## 1. System Overview
The Avatar Engine is a standalone Node.js service (`backend/avatar_engine`) that powers **Sara**, the 3D HR Interviewer. It is built to minimize latency and provide an "Uncanny Valley"-free experience by synchronizing voice, facial expressions, and body language.

---

## 2. Real-Time Voice-to-Voice (V2V) Pipeline

The magic of Sara happens in a high-speed 4-step loop:

### Step 1: Audio Capture & Encoding (Frontend)
The React frontend captures audio using the `MediaRecorder` API (WebM format). When the user finishes speaking, the raw binary data is encoded to **Base64** and sent to the `/sts` (Speech-to-Speech) endpoint.

### Step 2: Transcription (Whisper-large-v3)
Inside `modules/whisper.mjs`:
- The Base64 string is converted back to a Buffer.
- It is saved to a unique temporary file in `os.tmpdir()`.
- The file stream is piped to **Groq's Whisper API**.
- **Expert Detail**: We use `whisper-large-v3` with `temperature: 0` to ensure highly accurate transcription even with technical jargon or accents.

### Step 3: Conversational Intelligence (Llama 3.3 70B)
The transcribed text is passed to the `getAIResponse` function in `index.js`.
- **System Prompting**: A massive "Persona Prompt" defines Sara as an empathetic but professional HR manager.
- **Emotional Injection**: If the frontend detects the user is "Stressed" (via `face-api.js`), the prompt is dynamically updated to include: *"The candidate looks stressed. Be more encouraging."*
- **JSON Structured Output**: We force the AI to return a specific JSON schema using LangChain's `StructuredOutputParser`. This schema includes:
    - `text`: The spoken response.
    - `facialExpression`: (smile, sad, angry, surprised, funnyFace, default).
    - `animation`: (talking1, asking, disagree, welcoming, etc.).

### Step 4: Animation & Audio Feedback (Frontend)
The JSON arrives at the React app, which then passes it to the 3D Iframe via `postMessage`.

---

## 3. The 3D Rendering Engine (`avatar.html`)
Located in `public/`, this file is the "face" of the project.

### Three.js & TalkingHead
- It utilizes the **TalkingHead** library, a high-level wrapper around **Three.js**.
- **Model Loading**: It asynchronously loads `avatar.glb` (the mesh) and `animations.glb` (the library of movements).
- **Camera Config**: Uses an "upper body" view with specific Y-offsets (`cameraY: 0.1`) to create a professional "Zoom call" perspective.

### Lip-Sync Synchronization
The lip-sync is **Phoneme-based**, not just volume-based.
1. The engine calculates the duration of each word in the text.
2. It generates a "Mouth Cue" timeline.
3. As the **Web Speech API** speaks the text, the 3D model's visemes (mouth shapes like 'aa', 'EE', 'OO') are morphed in real-time to match the sounds.

---

## 4. Implementation Details: Node.js Logic

### `index.js` (Server Core)
- **CORS & Limits**: Configured to accept 50MB payloads to accommodate high-quality audio buffers.
- **History Management**: Implements a `chatHistory` array that maintains the last 30 turns of conversation. This provides Sara with a "Short-term Memory," allowing her to reference things the user said earlier in the interview.
- **Fallback Logic**: If the AI fails to generate valid JSON, the server catches the error and returns a hardcoded "safety response" to keep the session from crashing.

### `modules/openAI.mjs` (LangChain Integration)
- Uses **LangChain** to create a chain (`prompt.pipe(model).pipe(parser)`).
- This ensures that the output is strictly validated against a **Zod Schema**. If the AI tries to return plain text, the parser will throw an error, which the main server handles gracefully.

---

## 5. Logical Flow: The Bridge
The communication between the **React Parent** and the **3D Iframe** is handled via a standardized protocol:
- **`type: 'speak'`**: Sends the text and animation to the avatar.
- **`type: 'stop'`**: Immediately flushes the animation queue and resets the avatar to an `idle` state. This is critical for **Interruptions**, allowing the user to cut Sara off if she's speaking too long.
- **`type: 'mood'`**: Can change the avatar's base mood without triggering a speech event.

---
*The result is an AI persona that doesn't just "talk" but "communicates" with body language, empathy, and situational awareness.*
