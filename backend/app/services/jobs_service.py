import httpx
from app.core.config import settings

class JobsService:
    async def search(self, query: str, location: str = None, type_contrat: str = None, page: int = 1):
        params = {"query": query, "page": str(page), "num_pages": "1"}
        if location: params["location"] = location
        headers = {"X-RapidAPI-Key": settings.JSEARCH_API_KEY, "X-RapidAPI-Host": "jsearch.p.rapidapi.com"}
        async with httpx.AsyncClient() as client:
            try:
                r = await client.get(f"{settings.JSEARCH_BASE_URL}/search", params=params, headers=headers, timeout=10)
                return r.json()
            except Exception as e:
                return {"data": [], "error": str(e)}
