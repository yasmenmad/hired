"""
Groq AI Service — powers all AI features in Hired.
Uses: llama-3.3-70b-versatile (fast, smart, free tier)
"""

import json
import re
import logging
from groq import AsyncGroq
from app.core.config import get_settings

log      = logging.getLogger(__name__)
settings = get_settings()

client = AsyncGroq(api_key=settings.groq_api_key)
MODEL  = settings.groq_model


async def _chat(messages: list[dict], temperature: float = 0.7, max_tokens: int = 1024) -> str:
    """Core chat call — returns raw text."""
    try:
        resp = await client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        content = resp.choices[0].message.content
        return (content or "").strip()
    except Exception as e:
        log.error(f"Groq API error: {e}")
        raise RuntimeError(f"AI service unavailable: {e}")


def _extract_json(raw: str) -> str:
    """
    Robustly extract JSON from a model response that may contain
    markdown fences, leading text, or trailing commentary.
    """
    raw = raw.strip()

    # Remove markdown fences: ```json ... ``` or ``` ... ```
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    raw = raw.strip()

    # If the model still prepended prose, find first { or [
    first_brace = min(
        (raw.find("{") if raw.find("{") != -1 else len(raw)),
        (raw.find("[") if raw.find("[") != -1 else len(raw)),
    )
    if first_brace > 0:
        raw = raw[first_brace:]

    # Trim trailing content after last } or ]
    last_close = max(raw.rfind("}"), raw.rfind("]"))
    if last_close != -1:
        raw = raw[: last_close + 1]

    return raw.strip()


async def _json_chat(
    messages: list[dict],
    temperature: float = 0.3,
    max_tokens: int = 1024,
) -> dict | list:
    """Chat call that parses and returns JSON. Raises ValueError on bad JSON."""
    msgs = messages.copy()
    msgs[-1]["content"] += (
        "\n\nIMPORTANT: Respond ONLY with valid JSON. "
        "No markdown fences, no backticks, no explanation, no extra text — pure JSON only."
    )
    raw = await _chat(msgs, temperature, max_tokens)
    cleaned = _extract_json(raw)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        log.error(f"JSON parse failed. Raw:\n{raw}\nCleaned:\n{cleaned}")
        raise ValueError(f"AI returned malformed JSON: {e}")


# ── 1. Job Match Score ──────────────────────────────────────────────────────

async def score_job_match(user_profile: dict, job: dict) -> dict:
    prompt = f"""You are an expert AI recruiter. Score this candidate's fit for this job.

CANDIDATE:
- Title: {user_profile.get('title', 'Not specified')}
- Skills: {', '.join(user_profile.get('skills', []))}
- Location: {user_profile.get('location', 'Not specified')}
- Bio: {user_profile.get('bio', '')[:300]}

JOB:
- Title: {job.get('title')}
- Company: {job.get('company')}
- Location: {job.get('location')}
- Skills required: {', '.join(job.get('skills', []))}
- Description: {job.get('description', '')[:600]}

Return JSON:
{{
  "score": <integer 0-100>,
  "reasons": ["<reason 1>", "<reason 2>", "<reason 3>"],
  "gaps": ["<gap 1>", "<gap 2>"],
  "verdict": "<Strong Match|Good Match|Fair Match|Weak Match>"
}}"""
    return await _json_chat([{"role": "user", "content": prompt}])


# ── 2. CV Analysis ──────────────────────────────────────────────────────────

async def analyze_cv(cv_text: str, job_description: str = "") -> dict:
    job_context = f"\nTarget job:\n{job_description[:600]}" if job_description else ""
    prompt = f"""You are a senior ATS optimization expert and career coach.

Analyze this CV:{job_context}

CV:
{cv_text[:3000]}

Return JSON:
{{
  "ats_score": <integer 0-100>,
  "overall_rating": "<Excellent|Good|Fair|Needs Work>",
  "keywords_found": ["<keyword>"],
  "missing_keywords": ["<keyword>"],
  "bullets_rewritten": <integer — count of weak bullets>,
  "issues": [
    {{"severity": "<high|medium|low>", "issue": "<description>", "fix": "<how to fix>"}}
  ],
  "strengths": ["<strength>"],
  "rewrites": [
    {{"section": "<section>", "original": "<original text>", "improved": "<improved version>"}}
  ],
  "suggestions": ["<suggestion>"],
  "summary": "<2-sentence overall assessment>"
}}"""
    return await _json_chat([{"role": "user", "content": prompt}], max_tokens=2048)


# ── 3. Cover Letter ─────────────────────────────────────────────────────────

async def generate_cover_letter(user_profile: dict, job: dict, tone: str = "professional") -> str:
    prompt = f"""Write a compelling, highly personalised cover letter.

CANDIDATE:
- Name: {user_profile.get('name', 'The Candidate')}
- Title: {user_profile.get('title', '')}
- Skills: {', '.join(user_profile.get('skills', [])[:10])}
- Bio: {user_profile.get('bio', '')[:300]}

JOB:
- Title: {job.get('title')}
- Company: {job.get('company')}
- Location: {job.get('location')}
- Description: {job.get('description', '')[:800]}

Tone: {tone}

Rules:
- Open with "Dear Hiring Team at {job.get('company')},"
- 3 paragraphs: hook + why me + why this company
- Include 2-3 quantified achievements
- Reference specific things from the job description
- End with a confident call to action
- Max 280 words
- Return ONLY the letter text, no JSON"""
    return await _chat([{"role": "user", "content": prompt}], temperature=0.75, max_tokens=700)


# ── 4. Interview Questions ──────────────────────────────────────────────────

async def generate_interview_questions(
    role: str,
    difficulty: str = "standard",
    focus: list[str] = None,
) -> list[dict]:
    focus_str = ", ".join(focus or ["Behavioral", "Technical"])

    difficulty_guide = {
        "warmup":   "Easy warm-up questions. Friendly, low-pressure. Simple behaviorals.",
        "standard": "Balanced mix of behavioral and technical. Moderate depth.",
        "tough":    "Deep behavioral dive. Multi-part situational questions. Probing follow-ups.",
        "brutal":   "FAANG-level difficulty. Complex system design, adversarial follow-ups, edge cases.",
    }.get(difficulty, "Balanced mix of behavioral and technical. Moderate depth.")

    prompt = f"""You are a senior interviewer at a top tech company conducting a real {difficulty} interview for: {role}

Difficulty guide: {difficulty_guide}
Focus areas: {focus_str}

Generate 6 realistic, role-specific interview questions. Make them feel like a real interview — not generic.
Reference actual technologies, frameworks, and scenarios relevant to {role}.

Return a JSON array:
[
  {{
    "question": "<the exact interview question — be specific, realistic>",
    "type": "<BEHAVIORAL|TECHNICAL|SYSTEM DESIGN|INTRO|SITUATIONAL|CASE STUDY>",
    "tip": "<coaching tip for answering well, max 25 words>",
    "follow_up": "<a natural follow-up question the interviewer might ask>"
  }}
]"""

    result = await _json_chat([{"role": "user", "content": prompt}], max_tokens=1800)
    if isinstance(result, list):
        return result
    # Handle case where model wraps array in an object
    for key in ("questions", "items", "data", "results"):
        if key in result:
            return result[key]
    return list(result.values())[0] if result else []


# ── 5. Answer Scoring ───────────────────────────────────────────────────────

async def score_interview_answer(question: str, answer: str, role: str) -> dict:
    prompt = f"""You are an experienced technical interviewer scoring a candidate response.

Role: {role}
Question: {question}
Answer: {answer}

Score using STAR methodology. Be honest and constructive — don't be too generous.

Return JSON:
{{
  "overall_score": <integer 0-100>,
  "communication": <integer 0-100>,
  "technical_depth": <integer 0-100>,
  "conciseness": <integer 0-100>,
  "star_breakdown": {{
    "situation": "<yes|partial|no> — did they set context?",
    "task": "<yes|partial|no> — did they explain their role?",
    "action": "<yes|partial|no> — did they describe specific actions?",
    "result": "<yes|partial|no> — did they quantify outcomes?"
  }},
  "strengths": ["<strength>"],
  "improvements": ["<specific improvement>", "<improvement 2>"],
  "ideal_answer_hint": "<1-2 sentences on what a great answer would include>",
  "verdict": "<Strong Hire|Hire|Maybe|No Hire>"
}}"""
    return await _json_chat([{"role": "user", "content": prompt}], temperature=0.3)


# ── 6. Salary Analysis ──────────────────────────────────────────────────────

async def analyze_salary(
    role: str,
    location: str,
    experience_years: int,
    skills: list[str],
) -> dict:
    prompt = f"""You are a compensation intelligence expert with deep knowledge of global tech salary markets.

Provide accurate salary analysis for:
- Role: {role}
- Location: {location}
- Experience: {experience_years} years
- Skills: {', '.join(skills[:8])}

Return JSON with realistic market data:
{{
  "currency": "<USD|EUR|GBP|MAD>",
  "percentile_25": <integer — annual salary>,
  "median": <integer>,
  "percentile_75": <integer>,
  "percentile_90": <integer>,
  "yoy_change": "<+X.X%>",
  "market_demand": "<High|Medium|Low>",
  "negotiation_tips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "counter_offer_script": "<2-3 sentence negotiation script tailored to this role>",
  "total_compensation_notes": "<note about equity/bonus typical for this role/level>",
  "top_paying_companies": ["<company 1>", "<company 2>", "<company 3>", "<company 4>"]
}}"""
    return await _json_chat([{"role": "user", "content": prompt}], max_tokens=1200)


# ── 7. Career Coaching Chat ─────────────────────────────────────────────────

async def career_chat(messages: list[dict], user_profile: dict) -> str:
    name     = user_profile.get("name", "there")
    title    = user_profile.get("title", "professional")
    skills   = ", ".join(user_profile.get("skills", [])[:8]) or "various skills"
    location = user_profile.get("location", "")
    bio      = user_profile.get("bio", "")[:200]

    system = f"""You are Alex, an elite career coach at Hired. — the AI-powered career platform.

Your client:
- Name: {name}
- Current role: {title}
- Skills: {skills}
- Location: {location}
- Background: {bio}

Your personality:
- Direct, warm, and brutally honest when needed
- Give SPECIFIC, ACTIONABLE advice — never vague platitudes
- Reference their actual profile, skills, and goals
- Use concrete examples, numbers, and real company names
- Ask clarifying questions to understand their situation better
- Keep responses under 180 words unless they ask for a deep dive
- Use bullet points for lists, but conversational prose otherwise
- React naturally to what they say — if they're frustrated, acknowledge it
- Deep expertise in: job searching strategy, salary negotiation, CV optimisation, technical interviews, career pivots, networking, personal brand building

Never say you can't help. Never give generic advice. Always be specific to {name}'s situation."""

    full_messages = [{"role": "system", "content": system}] + messages
    return await _chat(full_messages, temperature=0.8, max_tokens=600)


# ── 8. Job Summary ──────────────────────────────────────────────────────────

async def summarize_job(job_description: str, title: str) -> dict:
    prompt = f"""Summarise this {title} job posting into key insights.

Job description:
{job_description[:2000]}

Return JSON:
{{
  "summary": "<2-sentence plain English overview>",
  "one_liner": "<one sentence tagline>",
  "key_requirements": ["<requirement>"],
  "required_skills": ["<skill>"],
  "nice_to_have": ["<skill>"],
  "culture_signals": ["<culture clue>"],
  "red_flags": ["<concern>"],
  "match_tips": ["<tip to stand out>"],
  "ideal_candidate": "<2 sentence profile of who this is perfect for>"
}}"""
    return await _json_chat([{"role": "user", "content": prompt}], temperature=0.3, max_tokens=900)


# ── 9. Company Details ─────────────────────────────────────────────────────

async def get_company_details(company_name: str, job_title: str = "") -> dict:
    prompt = f"""You are a business intelligence expert. Provide detailed, accurate information about this company for a job seeker.

Company: {company_name}
Job being considered: {job_title}

Return a JSON object with real, accurate information:
{{
  "description": "<2-3 sentence description of what the company does, their mission, and scale>",
  "industry": "<primary industry>",
  "size": "<employee count range e.g. '1,000-5,000'>",
  "headquarters": "<city, country>",
  "founded": "<year or 'Unknown'>",
  "website": "<official website URL>",
  "culture_tags": ["<culture value 1>", "<culture value 2>", "<culture value 3>", "<culture value 4>"],
  "known_for": ["<thing they are known for 1>", "<thing 2>", "<thing 3>"],
  "glassdoor_rating": <float 3.0-5.0 or null if unknown>,
  "funding_stage": "<Public|Series X|Private|Unknown>",
  "notable_products": ["<product 1>", "<product 2>"],
  "interview_tips": "<2 sentence tip for interviewing at this specific company>"
}}"""
    return await _json_chat([{"role": "user", "content": prompt}], temperature=0.2, max_tokens=800)


# ── 10. Interview Session Save & Feedback ─────────────────────────────────

async def save_interview_session(session_data: dict) -> dict:
    role = session_data.get("role", "the role")
    answers = session_data.get("answers", [])
    scores = session_data.get("scores", [])
    overall = session_data.get("overall_score", 0)
    duration = session_data.get("duration_seconds", 0)

    prompt = f"""You are an expert interview coach reviewing a completed interview session.

Role: {role}
Number of questions answered: {len(answers)}
Overall score: {overall}/100
Duration: {duration // 60} minutes

Provide comprehensive feedback. Return JSON:
{{
  "overall_score": {overall},
  "performance_label": "<Strong Hire|Hire|Maybe|No Hire>",
  "session_summary": "<3-4 sentence overall assessment>",
  "top_strength": "<their single biggest strength observed>",
  "top_improvement": "<the single most important thing to improve>",
  "next_steps": ["<actionable step 1>", "<actionable step 2>", "<actionable step 3>"]
}}"""
    return await _json_chat([{"role": "user", "content": prompt}], temperature=0.3, max_tokens=600)
