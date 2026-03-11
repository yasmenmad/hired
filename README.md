# 🚀 Hired — Plateforme intelligente de recherche d'emploi

## Stack technique
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: FastAPI (Python) + SQLAlchemy + Alembic
- **Base de données**: PostgreSQL 16
- **IA**: OpenAI GPT-4o (génération CV, simulateur, compatibilité)
- **Jobs API**: JSearch (RapidAPI)
- **Auth**: JWT (access + refresh tokens) + bcrypt
- **Infra**: Docker + Docker Compose

---

## 📁 Structure du projet

```
hired/
├── backend/
│   ├── app/
│   │   ├── core/          # config, database, security
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── routers/       # FastAPI routers
│   │   ├── services/      # Business logic (AI, jobs)
│   │   └── repositories/  # Data access layer
│   ├── migrations/        # Alembic migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/         # React pages
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API calls (axios)
│   │   ├── store/         # Zustand stores
│   │   ├── hooks/         # Custom React hooks
│   │   └── types/         # TypeScript types
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

---

## ⚡ Lancement rapide (Docker)

```bash
# 1. Cloner et configurer les variables d'environnement
cp .env.example .env
# Remplir OPENAI_API_KEY et JSEARCH_API_KEY dans .env

# 2. Lancer tout le projet
docker-compose up --build

# Frontend → http://localhost:3000
# Backend  → http://localhost:8000
# API docs → http://localhost:8000/docs
```

---

## 🔧 Lancement en développement (sans Docker)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configurer .env
cp .env.example .env

# Migrations
alembic upgrade head

# Lancer
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Mettre VITE_API_URL=http://localhost:8000/api
npm run dev
```

---

## 🔑 Variables d'environnement

```env
# Backend .env
DATABASE_URL=postgresql://hired_user:hired_pass@localhost:5432/hired_db
SECRET_KEY=your-super-secret-key
OPENAI_API_KEY=sk-...
JSEARCH_API_KEY=your-jsearch-key
ALLOWED_ORIGINS=["http://localhost:3000"]

# Frontend .env.local
VITE_API_URL=http://localhost:8000/api
```

---

## 📋 Fonctionnalités

| Module | Fonctionnalité |
|---|---|
| 🔐 Auth | Inscription, connexion JWT, refresh token |
| 👤 Profil | Modifier infos pro, compétences, préférences |
| 📄 CV | Upload PDF/DOCX, génération IA, optimisation ATS, export |
| 💼 Job Feed | Recherche JSearch, score compatibilité GPT-4o, sauvegarde |
| 📊 Tracker | Kanban 5 colonnes, priorités, export Excel/CSV |
| 🎤 Simulateur | Entretien IA streaming GPT-4o, rapport STAR |
| 🔔 Notifications | Système admin → utilisateurs |
| 🛡️ Admin | Stats, gestion users, ban/unban |

---

## 🗄️ Modèle de données

8 entités principales :
`Utilisateur` · `Profil` · `CV` · `OffreEmploi` · `Candidature` · `SessionEntretien` · `Notification` · `TestPreferences`

---

## 👥 Auteurs
Yasmine Daoudi · Hiba Filali — PFE 2024/2025
