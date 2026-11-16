# Hired. — Backend Architecture: Deep Dive (Expert Version)

This document provides an exhaustive technical breakdown of the **Hired.** backend, a high-performance Python microservice architecture built with **FastAPI** and **Groq AI**.

---

## 1. System Design & Core Technologies
The backend is designed as an asynchronous RESTful API, optimized for real-time AI processing and efficient job data aggregation.

### 🛠️ Core Stack
- **Framework**: FastAPI (Pydantic V2 + Starlette).
- **Asynchrony**: Python `asyncio` for non-blocking I/O (Database & AI calls).
- **Intelligence Engine**: Groq Cloud SDK (Llama 3.3 70B & Whisper-large-v3).
- **ORM / Database**: SQLAlchemy with `aiosqlite` for asynchronous SQLite interactions.
- **Authentication**: JWT (JSON Web Tokens) with `python-jose` and `passlib` for bcrypt hashing.

---

## 2. Directory & Component Breakdown (`backend/app/`)

### A. Core Layer (`/core`)
The foundation of the service.
- **`config.py`**: Uses `pydantic-settings` to manage environment variables. It defines the `Settings` class with sensible defaults and `.env` support. Features an `@lru_cache` for optimized configuration access.
- **`database.py`**: Manages the life-cycle of the SQLite connection. Implements the `get_db` generator for FastAPI Dependency Injection.
- **`security.py`**: Contains the logic for creating/verifying JWT tokens and hashing passwords.

### B. API Routing Layer (`/api/routes`)
Each module represents a specific domain in the Hired. ecosystem.
- **`auth.py`**: Implements the standard OAuth2 password flow. It handles user registration and profile updates.
- **`ai.py` (The Logic Hub)**:
    - **CV Analysis**: Uses a complex prompt to score CVs against job descriptions. It returns structured JSON containing ATS scores and improvement lists.
    - **Interview Generation**: Dynamically constructs interview question sets based on role and difficulty level.
    - **Chat Orchestration**: Maintains stateless conversation context for the career advisor chat.
- **`jobs.py`**: Aggregates job data from multiple sources. It includes logic for "Match Scoring" — a proprietary algorithm that uses Llama-3 to compare a user's skills against a job's requirements.
- **`applications.py`**: CRUD operations for the job tracking (Kanban) system.

### C. Models Layer (`/models`)
Defines the database schema using SQLAlchemy's Declarative Base.
- **`User`**: Core user data, hashed credentials, and profile metadata.
- **`Job`**: Cached job listings with metadata (location, salary, source).
- **`Application`**: Represents the link between a User and a Job, including current status (Applied, Interviewing, etc.) and AI-generated notes.

---

## 3. The AI Integration Pipeline
Hired. uses a **Prompt-as-a-Service** pattern.
1. **Construction**: The backend takes raw data (e.g., CV text) and wraps it in a "System Prompt" defined in the route.
2. **Inference**: The request is sent to Groq. Because Groq uses LPU (Language Processing Units), responses are often received in < 1 second.
3. **Parsing**: The backend uses Pydantic models or Regex to extract valid JSON from the AI response, ensuring the frontend receives clean, type-safe data.

---

## 4. Middleware & Lifecycle Management
- **CORS**: Configured in `main.py` to allow requests from the Vite frontend (port 5173/5174) and the Avatar engine (port 3000).
- **Lifespan**: The `@asynccontextmanager` in `main.py` handles the startup database initialization (`init_db`), ensuring tables are ready before the first request arrives.
- **Global Error Handling**: A custom exception handler catches all unhandled `Exception` instances, logs the stack trace, and returns a clean 500 JSON response to avoid leaking sensitive internal state.

---

## 5. Security Model
- **Password Safety**: Never stored in plain text. Uses `bcrypt` with a work factor (salt) of 12.
- **Token Scope**: JWTs contain the user ID and expiration timestamp.
- **Route Protection**: FastAPI's `Depends(get_current_user)` is used on all protected routes to enforce authentication.

---

## 6. Job Aggregation Strategy
The `jobs.py` router is designed for extensibility. It supports:
- **Mock Data**: For rapid testing and UI development.
- **Scraping Hooks**: Triggers that can initiate asynchronous scraping tasks.
- **AI Matching**: A secondary pass where the AI ranks jobs by "Fit Percentage" based on the authenticated user's profile.

---
*This backend is designed for 100% decoupling. It could be redeployed as a set of Lambda functions or a Dockerized Kubernetes cluster with minimal changes.*
