# Hired - Intelligent Recruitment Automation & Sara 3D AI Interviewer

[![React](https://img.shields.io/badge/Frontend-React_19_%2B_Tailwind_4-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Node.js](https://img.shields.io/badge/Avatar_Engine-Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Three.js](https://img.shields.io/badge/3D_Engine-Three.js_%2F_TalkingHead-black?logo=three.js&logoColor=white)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Live Deployment:** [https://yasmenmad.github.io/hired/](https://yasmenmad.github.io/hired/)  
> **Interactive 3D Avatar:** Sara (Virtual HR Interviewer with Three.js & TalkingHead)  
> **Technical Architecture:** [`AVATAR_LOGIC.md`](./AVATAR_LOGIC.md) | [`BACKEND_ARCHITECTURE.md`](./BACKEND_ARCHITECTURE.md) | [`FRONTEND_ARCHITECTURE.md`](./FRONTEND_ARCHITECTURE.md)  
> **Author:** Yasmine Daoudi

A production-grade recruitment automation platform that integrates career management, automated resume scoring, and **Sara**, a real-time conversational 3D AI interviewer powered by phoneme-synchronized lip-sync, Whisper-large-v3 speech recognition, and Llama 3.3 70B persona modeling.

---

## System Architecture

```mermaid
flowchart TD
    User([Candidate Voice / Audio]) -->|WebM Stream| Client[React 19 Frontend Client]
    Client -->|postMessage| AvatarIframe[Three.js / TalkingHead 3D Canvas<br/>Sara Avatar Mesh: avatar.glb]
    Client -->|Base64 Audio / REST| AvatarEngine[Node.js Avatar Engine Service]
    AvatarEngine -->|Whisper-large-v3| WhisperAPI[Speech-to-Text Transcriber]
    WhisperAPI -->|Transcribed Text| LLM[Llama 3.3 70B / LangChain Persona]
    LLM -->|Structured JSON: Speech, Visemes, Animations| AvatarEngine
    AvatarEngine -->|Audio + Viseme Timeline| Client
    Client -->|FastAPI Gateway| Backend[Python FastAPI REST API]
    Backend --> DB[(SQLite / PostgreSQL Relational DB)]
```

---

## Core Engineering Modules

### 1. Sara 3D Avatar Engine (`avatar_engine` & `avatar.html`)
- **Three.js & TalkingHead:** Loads dynamic upper-body 3D mesh (`avatar.glb`) with realistic viseme morph targets for phoneme-accurate lip-synchronization.
- **Bi-Directional Communication:** Uses window `postMessage` protocol between the React parent and the sandboxed 3D WebGL context to trigger dynamic gestures (welcoming, questioning, thinking, agreeing).
- **Emotion Analysis:** Dynamically adjusts persona prompts if stress indicators are detected during interview rounds.

### 2. Frontend Client (React 19 + Tailwind CSS 4)
- **Domain-Driven Design (DDD):** Layered separation across `domain/`, `application/`, `infrastructure/`, and `presentation/`.
- **Pages & Tooling:** Live interview room (`AvatarInterviewPage.jsx`), interactive job tracking Kanban board, salary benchmarking visualizer, and candidate profile management.

### 3. Backend Services (FastAPI & Node.js)
- **FastAPI REST Engine:** Asynchronous job indexing, application tracking, and profile matching.
- **Node.js Avatar Microservice:** High-throughput streaming audio ingestion and Whisper/LangChain pipeline.

---

## Technical Specifications & Documentation

- Detailed 3D lip-sync and audio pipeline: [`AVATAR_LOGIC.md`](./AVATAR_LOGIC.md)
- Backend services & API routes: [`BACKEND_ARCHITECTURE.md`](./BACKEND_ARCHITECTURE.md)
- Frontend component architecture: [`FRONTEND_ARCHITECTURE.md`](./FRONTEND_ARCHITECTURE.md)
- Conception and business requirements: [`PROJECT_CONCEPTION.md`](./PROJECT_CONCEPTION.md)

---

## Local Development Quickstart

### 1. Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```

### 2. Backend Services
```bash
# Python FastAPI
cd backend
python -m venv venv
venv\Scripts\activate  # On Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Avatar Engine (Node.js)
cd backend/avatar_engine
npm install
node index.js
```

---

## License

MIT Open Source License - Copyright (c) 2026 Yasmine Daoudi
