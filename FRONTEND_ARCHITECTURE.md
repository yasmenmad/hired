# Hired. — Frontend Architecture: Deep Dive (Expert Version)

This document provides an exhaustive technical breakdown of the **Hired.** frontend architecture. It is written for senior engineers to understand, maintain, or rebuild the system from scratch.

---

## 1. Architectural Philosophy: Clean Architecture & DDD
The frontend is built upon **Domain-Driven Design (DDD)** principles and **Clean Architecture**. This decoupling ensures that the core business logic remains independent of the UI library (React), the API client (Fetch/Axios), and the specific state management implementation.

### 📦 The Layered Structure (`frontend/src/`)

#### A. Domain Layer (`/domain`)
The absolute center of the application. It contains zero dependencies on external libraries.
- **`entities/`**: Plain JavaScript objects representing our models (`Job`, `User`, `CV`). These are not just data containers; they contain validation logic and business rules.
- **`repositories/`**: Interface contracts. For example, `IJobRepository` defines that we must have a `getById(id)` method. The domain doesn't care if this comes from a REST API, GraphQL, or LocalStorage.
- **`valueObjects/`**: Immutable types like `SalaryRange` or `SkillsList` that encapsulate complex data logic.

#### B. Application Layer (`/application`)
The "Orchestrator" layer. It implements the use cases of the platform.
- **`useCases/`**: Pure functions like `ScoreCVUseCase` or `SubmitInterviewAnswer`. They coordinate the Flow of Data: they call a repository to get data, apply business logic from an entity, and return the result.
- **`services/`**: Cross-cutting logic such as `NotificationService` or `ValidationService`.

#### C. Infrastructure Layer (`/infrastructure`)
The "Implementation" layer. This is where we touch the outside world.
- **`api/apiClient.js`**: A highly resilient API wrapper.
    - **Feature**: Automatic Mock Fallback. If the FastAPI backend is offline, the client automatically switches to `localStorage`-based mock data. This allows for offline development and demo stability.
    - **Auth Interceptors**: Automatically injects JWT tokens from `localStorage` into every request.
    - **Error Handling**: Standardized error parsing for FastAPI's `HTTPException` format.
- **`context/SettingsContext.jsx`**: Global singleton for system-wide settings.
    - Handles **Dark/Light Mode** switching.
    - Handles **i18n** language selection (English, French, Arabic).
    - Persists state in `localStorage` for session continuity.
- **`repositories/`**: Concrete implementations of domain interfaces. `ApiJobRepository` uses `apiClient` to fulfill the `IJobRepository` contract.

#### D. Presentation Layer (`/presentation`)
The React-specific layer.
- **`pages/`**: Stateful containers.
    - `LandingPage.jsx`: The marketing entry, highly optimized for performance and visual impact.
    - `AvatarInterviewPage.jsx`: The most complex page. It manages a dual-state machine (Microphone recording state vs. AI thinking state) and communicates with the 3D Avatar iframe.
- **`components/`**: Divided into `common/` (atomic elements like `Button`, `Toast`) and feature-specific folders (`jobs/`, `interview/`).
- **`hooks/`**: Custom hooks like `useAuth`, `useToast`, and `useCamera` to keep component logic lean.

---

## 2. State Management Strategy
Instead of a heavy global store (like Redux), Hired. uses a **Hybrid State Model**:
1. **Global State**: Managed via `SettingsContext`. Used for cross-cutting concerns (Theme, Lang, User Session).
2. **Local Component State**: Managed via `useState` and `useReducer` for page-specific UI states (e.g., "Is the modal open?").
3. **Implicit State**: Handled via custom hooks to avoid prop-drilling.

---

## 3. Communication Logic: The Avatar Bridge
One of the most complex architectural pieces is the bridge between the React frontend and the 3D Avatar (TalkingHead).
1. **The Iframe**: `AvatarInterviewPage` renders an iframe pointing to `/avatar.html`.
2. **Protocol**: Communication happens over `window.postMessage`.
3. **Events**:
    - `type: 'speak'`: Triggered by the React app when the AI response arrives.
    - `type: 'stop'`: Triggered when the user interrupts or the call ends.
4. **Synchronization**: The React app maintains a `playingRef` and a `messagesQueueRef` to ensure that if multiple AI responses arrive, they are played sequentially with correct lip-sync timing.

---

## 4. Internationalization (i18n)
Built with `i18next`. The configuration in `i18n.js` supports:
- **Right-to-Left (RTL)**: Support for Arabic layout shifts.
- **Lazy Loading**: Locales are stored in `/locales` JSON files.
- **Interpolation**: Dynamic string replacement for personalized greetings (e.g., "Welcome back, {{name}}").

---

## 5. Styling & UX System
The project uses a **CSS variable-driven design system** defined in `index.css`.
- **Theming**: Dark mode is handled by a `.dark` class on the `body` tag, which overrides the primary HSL color variables.
- **Glassmorphism**: Extensive use of `backdrop-filter: blur()` and semi-transparent RGBA borders for a premium "Apple-like" feel.
- **Animations**: Custom keyframes (`vPulse`, `vBounce`, `vSpin`) defined globally for consistent micro-interactions.

---
*This architecture allows for a complete swap of the UI (e.g., to React Native) by reusing the Domain and Application layers without modification.*
