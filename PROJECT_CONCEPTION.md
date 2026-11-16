# HIRED. — Project Technical Conception & Architecture

Welcome to **Hired.**, a state-of-the-art AI-powered career platform designed to revolutionize the job search and interview experience. This document explains the architecture, technologies, and logical flow of the project.

---

## 1. High-Level Architecture

The project follows a **Microservices-inspired Monorepo** structure, separating the core application logic from specialized AI processing engines.

### 🏗️ General Layout
- **`frontend/`**: A React single-page application (SPA) built with Vite.
- **`backend/`**: A Python-based REST API built with FastAPI.
- **`backend/avatar_engine/`**: A specialized Node.js service for real-time 3D avatar interactions.

---

## 2. Technology Stack

### 🎨 Frontend
- **Core**: React 18, JavaScript (ES6+), Vite (Build Tool).
- **Styling**: Vanilla CSS with a customized Design System (Glassmorphism, Dark Mode).
- **Localization**: `i18next` for English, French, and Arabic support.
- **3D Rendering**: `TalkingHead` library (Three.js based) for the AI Interviewer.
- **State Management**: React Context API (`SettingsContext`, `AuthContext`).

### ⚙️ Backend (Main API)
- **Framework**: FastAPI (Python 3.10+).
- **AI Orchestration**: Groq SDK (using Llama 3.3 70B).
- **Database**: SQLite (managed via SQLAlchemy or raw SQL utilities).
- **Security**: JWT-based Authentication.
- **Scraping**: Integration with multiple job sources (Indeed, LinkedIn, etc.) via mock/live aggregators.

### 🤖 AI Avatar Engine
- **Runtime**: Node.js + Express.
- **Transcription**: Whisper (via Groq API) for Speech-to-Text.
- **Logic**: Llama 3.3 for conversational intelligence.
- **Animation**: Custom metadata generation for facial expressions and 3D animations.

---

## 3. Directory & File Breakdown

### 📂 Frontend (`frontend/src/`)
The frontend follows **Clean Architecture** principles to separate concerns.

- **`domain/`**: Contains pure business entities and rules.
- **`infrastructure/`**: Handles external communications.
    - `api/apiClient.js`: Centralized API caller.
    - `context/`: Application-wide states (Theme, Auth, Language).
- **`presentation/`**: Everything related to the UI.
    - `pages/`: The main application screens.
        - `LandingPage.jsx`: The premium entry point.
        - `InterviewPage.jsx`: The core interview setup and chat mode.
        - `AvatarInterviewPage.jsx`: The immersive 3D video call experience.
        - `JobsPage.jsx`: Smart job feed with AI matching scores.
    - `components/`: Reusable UI elements (Buttons, Cards, Nav).
- **`locales/`**: JSON translation files for i18n.

### 📂 Backend (`backend/app/`)
- **`main.py`**: Entry point. Sets up CORS, lifespan events, and routers.
- **`api/routes/`**: Endpoint definitions.
    - `auth.py`: Login/Register logic.
    - `jobs.py`: Search and filtering logic for job listings.
    - `ai.py`: CV analysis, Cover Letter generation, and AI chat.
- **`core/`**: Configuration, database setup, and shared utilities.

### 📂 Avatar Engine (`backend/avatar_engine/`)
- **`index.js`**: Express server managing `/sts` (Speech-to-Speech) and `/tts` (Text-to-Speech) endpoints.
- **`modules/whisper.mjs`**: Handles audio processing and transcription.
- **`public/avatar.html`**: The specific container for the 3D model, loaded via Iframe in the React app.

---

## 4. Logical Integration (How things connect)

### 🔄 The Interview Flow
1. **Selection**: The user chooses a role and difficulty in `InterviewPage.jsx`.
2. **Mode Switch**:
    - **Chat Mode**: Frontend sends text to `backend/api/v1/ai` -> Groq -> Returns text.
    - **Video Call**:
        - Frontend uses `MediaRecorder` to capture audio.
        - Audio is sent to `Avatar Engine` (port 3000).
        - Engine transcribes audio (Whisper), gets AI response (Llama), and returns JSON containing text + animation metadata.
        - The `avatar.html` in the iframe receives a `postMessage` and plays the animation/speech.

### 📈 The Data Flow
- **Authentication**: `SignInPage` -> `backend/auth` -> JWT stored in `localStorage` -> Included in `apiClient` headers.
- **Job Feed**: `JobsPage` calls `backend/jobs`. The backend fetches listings and calls `Groq` to calculate a "Match Score" based on the user's profile.

---

## 5. Deployment & Configuration
- **Environment**: Managed via `.env` files in all three main directories.
- **Startup**: The project includes `START.ps1` and `start.bat` scripts to launch the database, backend, and frontend simultaneously.

---

*This document is intended for developers to understand the conception and maintainability of the Hired. platform.*
