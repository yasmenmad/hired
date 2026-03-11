from groq import AsyncGroq
from app.core.config import settings
from typing import AsyncGenerator, List
import json

client = AsyncGroq(api_key=settings.GROQ_API_KEY)

class AIService:

    # ─── CV GENERATION ───────────────────────────────────────
    async def generate_cv(self, questionnaire: dict) -> dict:
        prompt = f"""
Tu es un expert en rédaction de CV optimisés ATS.
À partir du questionnaire suivant, génère un CV complet et structuré :
{json.dumps(questionnaire, ensure_ascii=False, indent=2)}

Retourne un JSON avec cette structure :
{{
  "nom_complet": "",
  "titre_pro": "",
  "email": "",
  "telephone": "",
  "localisation": "",
  "resume": "",
  "experiences": [{{"entreprise":"","poste":"","duree":"","description":""}}],
  "formations": [{{"etablissement":"","diplome":"","annee":""}}],
  "competences": [],
  "langues": [{{"langue":"","niveau":""}}],
  "projets": [{{"nom":"","description":"","technologies":[]}}],
  "certifications": [],
  "score_ats": 0
}}
Réponds UNIQUEMENT avec le JSON, sans markdown.
"""
        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        text = response.choices[0].message.content.strip()
        return json.loads(text)

    # ─── CV OPTIMIZATION STREAM ───────────────────────────────
    async def optimize_cv_stream(self, cv_content: str, job_description: str = None) -> AsyncGenerator[str, None]:
        job_ctx = f"\nOffre ciblée :\n{job_description}" if job_description else ""
        prompt = f"""
Tu es un expert en optimisation de CV pour les systèmes ATS.
Optimise ce CV pour maximiser son score ATS et sa pertinence.{job_ctx}

CV original :
{cv_content}

Fournis :
1. Le CV optimisé complet
2. Les mots-clés ATS ajoutés
3. Le score ATS estimé avant et après (0-100)
4. Les 3 principales améliorations apportées
"""
        stream = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    # ─── CV TEXT EXTRACTION ───────────────────────────────────
    async def extract_cv_text(self, content: bytes, mime_type: str) -> dict:
        prompt = "Extrais les informations de ce CV et retourne un JSON structuré avec les sections: nom, email, experiences, formations, competences, langues."
        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"raw": response.choices[0].message.content}

    # ─── COMPATIBILITY SCORE ──────────────────────────────────
    async def calculate_compatibility(self, profil: dict, offre: dict) -> dict:
        prompt = f"""
Analyse la compatibilité entre ce profil candidat et cette offre d'emploi.

Profil :
{json.dumps(profil, ensure_ascii=False)}

Offre :
{json.dumps(offre, ensure_ascii=False)}

Retourne un JSON :
{{
  "score": 85,
  "points_forts": ["compétence X correspond", "niveau d'exp adapté"],
  "lacunes": ["manque de compétence Y"],
  "recommandations": ["conseil pour améliorer sa candidature"]
}}
Réponds UNIQUEMENT avec le JSON.
"""
        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        return json.loads(response.choices[0].message.content)

    # ─── INTERVIEW QUESTION ───────────────────────────────────
    async def generate_interview_question(self, context: str, niveau: str, historique: list) -> str:
        history_text = "\n".join([f"{m['role']}: {m['content']}" for m in historique[-6:]])
        prompt = f"""
Tu es un recruteur professionnel qui conduit un entretien d'embauche pour ce poste :
{context}

Niveau du candidat : {niveau}
Historique de l'entretien :
{history_text}

Pose la prochaine question d'entretien pertinente. Sois naturel et professionnel.
Pose UNE seule question concise.
"""
        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()

    # ─── INTERVIEW RESPONSE STREAM ────────────────────────────
    async def interview_response_stream(self, historique: list, user_message: str, niveau: str) -> AsyncGenerator[str, None]:
        messages = [
            {"role": "system", "content": f"Tu es un recruteur professionnel. Niveau candidat: {niveau}. Réponds à sa réponse puis pose la question suivante."}
        ]
        for msg in historique[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": user_message})

        stream = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=messages,
            stream=True,
            temperature=0.7,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    # ─── STAR REPORT ──────────────────────────────────────────
    async def generate_star_report(self, historique: list) -> dict:
        conversation = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in historique])
        prompt = f"""
Analyse cet entretien et génère un rapport STAR détaillé :

{conversation}

Retourne un JSON :
{{
  "score_global": 75,
  "points_forts": [],
  "axes_amelioration": [],
  "evaluation_par_competence": {{"communication": 80, "technique": 70, "motivation": 85}},
  "recommandations": [],
  "resume": "Résumé de la performance"
}}
Réponds UNIQUEMENT avec le JSON.
"""
        response = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        try:
            return json.loads(response.choices[0].message.content)
        except:
            return {"resume": response.choices[0].message.content}
