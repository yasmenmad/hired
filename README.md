# 💼 Hired — Plateforme Intelligente de Recherche d'Emploi & Coaching de Carrière

[![React](https://img.shields.io/badge/Frontend-React_18_%2B_TypeScript-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_16-4169e1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![OpenAI](https://img.shields.io/badge/AI-OpenAI_GPT--4o-412991?logo=openai&logoColor=white)](https://openai.com/)
[![Docker](https://img.shields.io/badge/DevOps-Docker_Compose-2496ed?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Hired** est une plateforme SaaS complète d'aide au recrutement et d'optimisation de carrière propulsée par l'intelligence artificielle générative (GPT-4o). Elle intègre l'optimisation de CV compatible ATS, un agrégateur d'offres en temps réel (JSearch API), un tableau de bord de suivi Kanban et un simulateur d'entretien d'embauche adaptatif avec feedback selon la méthode STAR.

---

## 🏛️ Architecture Technique

```
hired/
├── backend/
│   ├── app/
│   │   ├── core/          # Configuration, sécurité JWT, session PostgreSQL
│   │   ├── models/        # Entités SQLAlchemy (Users, Jobs, Applications)
│   │   ├── schemas/       # Schémas de validation Pydantic
│   │   ├── routers/       # Endpoints FastAPI REST
│   │   ├── services/      # Logique métier (IA GPT-4o, Agrégateur JSearch)
│   │   └── repositories/  # Couche d'accès aux données (Repository Pattern)
│   ├── migrations/        # Migrations de schéma Alembic
│   ├── requirements.txt   # Dépendances Python
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/         # Vues React (Dashboard, CV, Jobs, Tracker, Interview)
│   │   ├── components/    # Composants réutilisables (Layout, Modals, Badges)
│   │   ├── services/      # Client HTTP Axios avec intercepteurs JWT
│   │   ├── store/         # Gestion d'état global Zustand
│   │   └── types/         # Interfaces & types TypeScript
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml     # Orchestration multi-conteneurs
```

---

## ⚡ Démarrage Rapide

### Option A — Déploiement Docker (Recommandé)

```bash
# 1. Configurer l'environnement
cp .env.example .env

# 2. Construire et démarrer l'ensemble des conteneurs
docker-compose up --build -d

# Frontend  → http://localhost:3000
# Backend   → http://localhost:8000
# Docs API  → http://localhost:8000/docs
```

---

### Option B — Environnement Local (Sans Docker)

#### 1. Backend (FastAPI + Python 3.11+)
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## 🎯 Fonctionnalités Principales

| Module | Spécifications Fonctionnelles |
| :--- | :--- |
| **Authentification Sécurisée** | JWT stateless (Access Token + Refresh Token tournant), salage bcrypt |
| **Optimiseur de CV & ATS** | Analyse sémantique de CV (PDF/DOCX), scoring de compatibilité et génération de formats ATS-friendly |
| **Agrégateur d'Offres (Job Feed)** | Recherche en temps réel via l'API JSearch, scoring de compatibilité algorithmique avec le profil |
| **Kanban Tracker** | Suivi dynamique des candidatures (Enregistré, Postulé, Entretien, Offre, Rejeté) avec export CSV/Excel |
| **Simulateur d'Entretien IA** | Simulation conversationnelle en streaming (GPT-4o), évaluation des réponses selon la méthode STAR (*Situation, Task, Action, Result*) |
| **Administration** | Supervision des utilisateurs, gestion des rôles et tableau de bord analytique |

---

## 👩‍💻 Auteure

**Yasmine Daoudi**  
*Projet de Fin d'Études (PFE) — Génie Informatique*  
Université Ibn Tofail — Kénitra, Maroc  
- LinkedIn : [linkedin.com/in/yasmine-daoudi-473260340](https://www.linkedin.com/in/yasmine-daoudi-473260340)  
- GitHub : [github.com/yasmenmad](https://github.com/yasmenmad)
