# Hired. — Backend API

FastAPI backend with Groq AI + multi-source job scraping.

## Quick Start

```bash
cd backend

# 1. Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# 4. Run the server
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Required API Keys

| Key | Required | Where to get |
|-----|----------|--------------|
| `GROQ_API_KEY` |  Yes | https://console.groq.com (free) |
| `RAPIDAPI_KEY` | Optional | https://rapidapi.com → JSearch API (for LinkedIn/Indeed) |

## Features

- **Job Feed**: RemoteOK, We Work Remotely, Arbeitnow, Greenhouse (free) + LinkedIn/Indeed via JSearch (RapidAPI)
- **AI Match Score**: Groq llama-3.3-70b rates your fit for each job
- **CV Analysis**: ATS score, issues, missing keywords, rewrite suggestions
- **Cover Letter**: AI-generated, tailored to each job
- **Interview Coach**: Real questions + STAR scoring per answer
- **Salary Intelligence**: Market benchmarks + negotiation script
- **Career Chat**: Conversational AI career advisor

## Admin Login

Email: `admin@hired.ai` | Password: `admin123`

## Architecture

```
app/
├── main.py               # FastAPI app + CORS + lifespan
├── core/
│   ├── config.py         # Settings (pydantic-settings)
│   └── database.py       # SQLite ORM models
├── api/routes/
│   ├── auth.py           # Register, login, JWT
│   ├── jobs.py           # Job search + scrape trigger
│   ├── ai.py             # All AI endpoints
│   └── applications.py   # Application pipeline
└── infrastructure/
    ├── scrapers/job_scraper.py   # Multi-source scraper
    └── ai/groq_service.py        # Groq AI service
```
