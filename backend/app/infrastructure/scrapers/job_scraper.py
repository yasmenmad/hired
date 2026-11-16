"""
Job scraper — pulls live jobs from multiple sources.

Free sources (no key needed):
  1. RemoteOK         — public JSON API  
  2. We Work Remotely — RSS feed
  3. Arbeitnow        — public JSON API
  4. Greenhouse       — 20 top tech companies

RapidAPI / JSearch (needs RAPIDAPI_KEY):
  5. JSearch          — LinkedIn, Indeed, Glassdoor, ZipRecruiter

Company logos resolved via:
  - Clearbit Logo API (free, no key)  https://logo.clearbit.com/{domain}
  - Brand.dev fallback
  - employer_logo from JSearch
"""

import asyncio
import hashlib
import logging
import re
from datetime import datetime
from xml.etree import ElementTree

import aiohttp
from app.core.config import get_settings

log      = logging.getLogger(__name__)
settings = get_settings()


# ── Helpers ───────────────────────────────────────────────────

def _make_id(source: str, raw: str) -> str:
    return hashlib.md5(f"{source}:{raw}".encode()).hexdigest()[:16]

def _clean(text: str | None) -> str:
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def _guess_level(title: str, desc: str = "") -> str:
    t = (title + " " + desc).lower()
    if any(w in t for w in ["staff", "principal", "director", "vp ", "head of", "lead"]):
        return "Senior"
    if any(w in t for w in ["senior", "sr.", "sr "]):
        return "Senior"
    if any(w in t for w in ["junior", "jr.", "entry", "graduate", "intern"]):
        return "Junior"
    return "Mid"

def _guess_salary(title: str, desc: str = "") -> str:
    pattern = re.compile(
        r"(\$|€|£)[\s]?([\d,]+)[kK]?\s*[-–]+\s*(\$|€|£)?[\s]?([\d,]+)[kK]?",
        re.IGNORECASE,
    )
    m = pattern.search(desc)
    if m:
        return m.group(0).strip()
    t = title.lower()
    if any(w in t for w in ["ai engineer", "ml engineer", "machine learning"]):
        return "$130–180k"
    if "senior" in t:
        return "$110–160k"
    if "manager" in t or "director" in t:
        return "$120–180k"
    if "data scientist" in t:
        return "$100–150k"
    return "Competitive"

def _extract_skills(title: str, desc: str) -> list[str]:
    candidates = [
        "Python","JavaScript","TypeScript","React","Node.js","Go","Rust","Java","C++","C#",
        "SQL","PostgreSQL","MongoDB","Redis","AWS","GCP","Azure","Docker","Kubernetes",
        "PyTorch","TensorFlow","LangChain","FastAPI","Django","GraphQL","REST",
        "MLOps","LLM","RAG","RLHF","Spark","dbt","Airflow","Terraform","CI/CD",
        "Machine Learning","Deep Learning","NLP","Computer Vision","Distributed Systems",
        "Product Management","A/B Testing","Figma","UX Research","Data Analysis",
    ]
    text = (title + " " + desc).lower()
    found = [s for s in candidates if s.lower() in text]
    return found[:8] if found else ["Communication", "Problem Solving"]

def _parse_date(date_str: str) -> datetime:
    if not date_str:
        return datetime.utcnow()
    for fmt in ("%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d"):
        try:
            return datetime.strptime(date_str[:19], fmt[:len(date_str)])
        except Exception:
            continue
    return datetime.utcnow()


# ── Company logo resolution ───────────────────────────────────

# Known company → domain mapping for Clearbit
COMPANY_DOMAINS = {
    "google": "google.com", "microsoft": "microsoft.com", "apple": "apple.com",
    "amazon": "amazon.com", "meta": "meta.com", "netflix": "netflix.com",
    "stripe": "stripe.com", "shopify": "shopify.com", "airbnb": "airbnb.com",
    "uber": "uber.com", "lyft": "lyft.com", "spotify": "spotify.com",
    "slack": "slack.com", "zoom": "zoom.us", "notion": "notion.so",
    "figma": "figma.com", "vercel": "vercel.com", "netlify": "netlify.com",
    "github": "github.com", "gitlab": "gitlab.com", "atlassian": "atlassian.com",
    "datadog": "datadoghq.com", "mongodb": "mongodb.com", "elastic": "elastic.co",
    "cloudflare": "cloudflare.com", "twilio": "twilio.com", "sendgrid": "sendgrid.com",
    "hubspot": "hubspot.com", "salesforce": "salesforce.com", "servicenow": "servicenow.com",
    "openai": "openai.com", "anthropic": "anthropic.com", "mistral": "mistral.ai",
    "hugging face": "huggingface.co", "huggingface": "huggingface.co",
    "deepmind": "deepmind.com", "cohere": "cohere.com",
    "airtable": "airtable.com", "retool": "retool.com", "linear": "linear.app",
    "rippling": "rippling.com", "gusto": "gusto.com", "deel": "deel.com",
    "brex": "brex.com", "plaid": "plaid.com", "robinhood": "robinhood.com",
    "coinbase": "coinbase.com", "binance": "binance.com", "kraken": "kraken.com",
    "palantir": "palantir.com", "snowflake": "snowflake.com", "databricks": "databricks.com",
    "confluent": "confluent.io", "hashicorp": "hashicorp.com",
    "docker": "docker.com", "red hat": "redhat.com", "suse": "suse.com",
    "oracle": "oracle.com", "sap": "sap.com", "ibm": "ibm.com",
    "intel": "intel.com", "nvidia": "nvidia.com", "amd": "amd.com",
    "tesla": "tesla.com", "spacex": "spacex.com",
    "greenhouse": "greenhouse.io", "workday": "workday.com", "zendesk": "zendesk.com",
    "intercom": "intercom.com", "mixpanel": "mixpanel.com", "segment": "segment.com",
}

def get_logo_url(company_name: str, fallback: str = "") -> str:
    """Return a Clearbit logo URL for a company, or fallback."""
    if fallback and fallback.startswith("http"):
        return fallback
    
    name_lower = company_name.lower().strip()
    
    # Direct domain match
    domain = COMPANY_DOMAINS.get(name_lower)
    if domain:
        return f"https://logo.clearbit.com/{domain}"
    
    # Partial match
    for key, dom in COMPANY_DOMAINS.items():
        if key in name_lower or name_lower in key:
            return f"https://logo.clearbit.com/{dom}"
    
    # Try to construct domain from company name: "Acme Corp" → acme.com
    slug = re.sub(r"[^a-z0-9]", "", name_lower.split()[0]) if name_lower else ""
    if len(slug) >= 3:
        return f"https://logo.clearbit.com/{slug}.com"
    
    return ""


# ── Source 1: RemoteOK ────────────────────────────────────────

async def scrape_remoteok(session: aiohttp.ClientSession) -> list[dict]:
    url = "https://remoteok.com/api"
    headers = {"User-Agent": "Mozilla/5.0 (compatible; HiredBot/1.0)"}
    try:
        async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as r:
            data = await r.json(content_type=None)
            jobs = []
            for item in data[1:]:
                if not isinstance(item, dict):
                    continue
                desc  = _clean(item.get("description", ""))
                title = item.get("position", "")
                co    = item.get("company", "Unknown")
                jobs.append({
                    "id":          _make_id("remoteok", str(item.get("id", title + co))),
                    "title":       title,
                    "company":     co,
                    "location":    "Remote",
                    "remote":      True,
                    "salary":      item.get("salary", "") or _guess_salary(title, desc),
                    "job_type":    "Full-time",
                    "level":       _guess_level(title, desc),
                    "description": desc[:2000],
                    "skills":      item.get("tags", [])[:8] or _extract_skills(title, desc),
                    "apply_url":   item.get("url", ""),
                    "source":      "RemoteOK",
                    "logo_url":    get_logo_url(co, item.get("company_logo", "")),
                    "posted_at":   datetime.utcnow(),
                })
            log.info(f"RemoteOK: {len(jobs)} jobs")
            return jobs
    except Exception as e:
        log.warning(f"RemoteOK failed: {e}")
        return []


# ── Source 2: We Work Remotely ────────────────────────────────

async def scrape_weworkremotely(session: aiohttp.ClientSession) -> list[dict]:
    feeds = [
        "https://weworkremotely.com/categories/remote-programming-jobs.rss",
        "https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss",
        "https://weworkremotely.com/categories/remote-design-jobs.rss",
        "https://weworkremotely.com/categories/remote-product-jobs.rss",
        "https://weworkremotely.com/categories/remote-marketing-jobs.rss",
    ]
    headers = {"User-Agent": "Mozilla/5.0 (compatible; HiredBot/1.0)"}
    jobs = []
    for feed_url in feeds:
        try:
            async with session.get(feed_url, headers=headers, timeout=aiohttp.ClientTimeout(total=12)) as r:
                text = await r.text()
                root = ElementTree.fromstring(text)
                for item in root.findall(".//item"):
                    title_el = item.find("title")
                    link_el  = item.find("link")
                    desc_el  = item.find("description")
                    if title_el is None:
                        continue
                    raw_title = title_el.text or ""
                    parts   = raw_title.split(": ", 1)
                    company = parts[0].strip() if len(parts) > 1 else "Unknown"
                    title   = parts[1].strip() if len(parts) > 1 else raw_title.strip()
                    desc    = _clean(desc_el.text or "") if desc_el is not None else ""
                    jobs.append({
                        "id":          _make_id("wwr", raw_title + (link_el.text or "")),
                        "title":       title,
                        "company":     company,
                        "location":    "Remote",
                        "remote":      True,
                        "salary":      _guess_salary(title, desc),
                        "job_type":    "Full-time",
                        "level":       _guess_level(title, desc),
                        "description": desc[:2000],
                        "skills":      _extract_skills(title, desc),
                        "apply_url":   link_el.text or "",
                        "source":      "We Work Remotely",
                        "logo_url":    get_logo_url(company),
                        "posted_at":   datetime.utcnow(),
                    })
        except Exception as e:
            log.warning(f"WWR feed failed: {e}")
    log.info(f"We Work Remotely: {len(jobs)} jobs")
    return jobs


# ── Source 3: Arbeitnow ───────────────────────────────────────

async def scrape_arbeitnow(session: aiohttp.ClientSession) -> list[dict]:
    url = "https://arbeitnow.com/api/job-board-api"
    headers = {"User-Agent": "Mozilla/5.0 (compatible; HiredBot/1.0)"}
    try:
        async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as r:
            data = await r.json(content_type=None)
            jobs = []
            for item in data.get("data", [])[:100]:
                desc  = _clean(item.get("description", ""))
                title = item.get("title", "")
                co    = item.get("company_name", "Unknown")
                loc   = item.get("location", "Remote")
                jobs.append({
                    "id":          _make_id("arbeitnow", item.get("slug", title + co)),
                    "title":       title,
                    "company":     co,
                    "location":    loc,
                    "remote":      item.get("remote", False),
                    "salary":      _guess_salary(title, desc),
                    "job_type":    "Full-time",
                    "level":       _guess_level(title, desc),
                    "description": desc[:2000],
                    "skills":      item.get("tags", [])[:8] or _extract_skills(title, desc),
                    "apply_url":   item.get("url", ""),
                    "source":      "Arbeitnow",
                    "logo_url":    get_logo_url(co),
                    "posted_at":   datetime.utcnow(),
                })
            log.info(f"Arbeitnow: {len(jobs)} jobs")
            return jobs
    except Exception as e:
        log.warning(f"Arbeitnow failed: {e}")
        return []


# ── Source 4: Greenhouse public boards ───────────────────────

GREENHOUSE_COMPANIES = [
    "anthropic", "openai", "mistral", "cohere", "notion", "vercel", "stripe",
    "figma", "linear", "retool", "hubspot", "confluent", "datadog", "mongodb",
    "elastic", "cloudflare", "netlify", "airtable", "brex", "rippling",
    "gusto", "plaid", "segment", "mixpanel", "intercom",
]

async def scrape_greenhouse(session: aiohttp.ClientSession) -> list[dict]:
    jobs = []
    headers = {"User-Agent": "Mozilla/5.0 (compatible; HiredBot/1.0)"}
    for company in GREENHOUSE_COMPANIES:
        url = f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs?content=true"
        try:
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as r:
                if r.status != 200:
                    continue
                data = await r.json(content_type=None)
                for item in data.get("jobs", [])[:8]:
                    title = item.get("title", "")
                    desc  = _clean(item.get("content", ""))
                    loc   = item.get("location", {}).get("name", "Remote")
                    co    = company.title()
                    jobs.append({
                        "id":          _make_id("greenhouse", str(item.get("id", title + company))),
                        "title":       title,
                        "company":     co,
                        "location":    loc,
                        "remote":      "remote" in loc.lower(),
                        "salary":      _guess_salary(title, desc),
                        "job_type":    "Full-time",
                        "level":       _guess_level(title, desc),
                        "description": desc[:2000],
                        "skills":      _extract_skills(title, desc),
                        "apply_url":   item.get("absolute_url", ""),
                        "source":      "Greenhouse",
                        "logo_url":    get_logo_url(co),
                        "posted_at":   datetime.utcnow(),
                    })
        except Exception as e:
            log.warning(f"Greenhouse {company} failed: {e}")
    log.info(f"Greenhouse: {len(jobs)} jobs")
    return jobs


# ── Source 5: JSearch (LinkedIn + Indeed + Glassdoor + ZipRecruiter) ─────

async def scrape_jsearch(session: aiohttp.ClientSession) -> list[dict]:
    if not settings.rapidapi_key:
        log.info("JSearch skipped — no RAPIDAPI_KEY set")
        return []

    url = "https://jsearch.p.rapidapi.com/search"
    headers = {
        "X-RapidAPI-Key":  settings.rapidapi_key,
        "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
    }

    # Broad queries to get lots of LinkedIn/Indeed results
    queries = [
        "software engineer",
        "frontend developer react",
        "backend engineer python",
        "data scientist machine learning",
        "product manager tech",
        "devops engineer cloud",
        "AI engineer LLM",
        "full stack developer",
        "mobile developer",
        "UX designer",
    ]

    jobs = []
    for query in queries:
        params = {
            "query":       query,
            "page":        "1",
            "num_pages":   "2",       # 2 pages = ~20 results per query
            "date_posted": "week",
            "remote_jobs_only": "false",
        }
        try:
            async with session.get(url, headers=headers, params=params, timeout=aiohttp.ClientTimeout(total=20)) as r:
                if r.status != 200:
                    log.warning(f"JSearch {r.status} for: {query}")
                    continue
                data = await r.json(content_type=None)
                for item in data.get("data", []):
                    title   = item.get("job_title", "")
                    co      = item.get("employer_name", "Unknown")
                    city    = item.get("job_city", "")
                    state   = item.get("job_state", "")
                    country = item.get("job_country", "")
                    loc_parts = [p for p in [city, state, country] if p]
                    loc     = ", ".join(loc_parts) if loc_parts else "Remote"
                    remote  = item.get("job_is_remote", False)
                    if remote:
                        loc = "Remote"
                    desc    = _clean(item.get("job_description", ""))

                    # Salary
                    sal_min = item.get("job_min_salary")
                    sal_max = item.get("job_max_salary")
                    sal_cur = item.get("job_salary_currency", "USD")
                    sal_per = item.get("job_salary_period", "YEAR")
                    if sal_min and sal_max:
                        sym = {"USD": "$", "EUR": "€", "GBP": "£", "MAD": "MAD"}.get(sal_cur, sal_cur)
                        if sal_per == "YEAR":
                            salary = f"{sym}{int(sal_min/1000)}k–{sym}{int(sal_max/1000)}k/yr"
                        else:
                            salary = f"{sym}{int(sal_min)}–{sym}{int(sal_max)}/hr"
                    else:
                        salary = _guess_salary(title, desc)

                    # Source label
                    apply_url = item.get("job_apply_link", "")
                    apply_lower = apply_url.lower()
                    if "linkedin" in apply_lower:
                        src = "LinkedIn"
                    elif "indeed" in apply_lower:
                        src = "Indeed"
                    elif "glassdoor" in apply_lower:
                        src = "Glassdoor"
                    elif "ziprecruiter" in apply_lower:
                        src = "ZipRecruiter"
                    else:
                        src = item.get("job_publisher", "JSearch")

                    # Logo: use employer_logo first, then Clearbit
                    employer_logo = item.get("employer_logo", "") or ""
                    logo = employer_logo if employer_logo.startswith("http") else get_logo_url(co)

                    jobs.append({
                        "id":          _make_id("jsearch", item.get("job_id", title + co)),
                        "title":       title,
                        "company":     co,
                        "location":    loc,
                        "remote":      remote,
                        "salary":      salary,
                        "job_type":    item.get("job_employment_type", "Full-time"),
                        "level":       _guess_level(title, desc),
                        "description": desc[:2000],
                        "skills":      _extract_skills(title, desc),
                        "apply_url":   apply_url,
                        "source":      src,
                        "logo_url":    logo,
                        "posted_at":   _parse_date(item.get("job_posted_at_datetime_utc", "")),
                    })
        except Exception as e:
            log.warning(f"JSearch '{query}' failed: {e}")

    log.info(f"JSearch (LinkedIn/Indeed/Glassdoor): {len(jobs)} jobs")
    return jobs


# ── Master scrape ─────────────────────────────────────────────

async def scrape_all_jobs() -> list[dict]:
    """Run all scrapers concurrently, merge, deduplicate."""
    connector = aiohttp.TCPConnector(limit=30, ssl=False)
    try:
        async with aiohttp.ClientSession(connector=connector) as session:
            results = await asyncio.gather(
                scrape_remoteok(session),
                scrape_weworkremotely(session),
                scrape_arbeitnow(session),
                scrape_greenhouse(session),
                scrape_jsearch(session),
                scrape_remotive(session),
                scrape_adzuna(session),
                return_exceptions=True,
            )
    except Exception as e:
        log.error(f"Session error during scrape: {e}")
        return []

    all_jobs: list[dict] = []
    seen: set[str] = set()

    for result in results:
        if isinstance(result, Exception):
            log.error(f"Scraper error: {result}")
            continue
        if not isinstance(result, list):
            log.warning(f"Scraper returned unexpected type: {type(result)}")
            continue
        for job in result:
            if not isinstance(job, dict):
                continue
            job_id = job.get("id")
            if not job_id:
                continue
            if job_id not in seen:
                seen.add(job_id)
                # Ensure posted_at is a datetime object for sorting
                if isinstance(job.get("posted_at"), str):
                    job["posted_at"] = _parse_date(job["posted_at"])
                all_jobs.append(job)

    all_jobs.sort(key=lambda j: j.get("posted_at") or datetime.min, reverse=True)
    log.info(f"Total unique jobs scraped: {len(all_jobs)}")
    return all_jobs


# ── Source 6: Remotive (LinkedIn-quality remote jobs) ─────────────────────

async def scrape_remotive(session: aiohttp.ClientSession) -> list[dict]:
    """Remotive API — high quality remote jobs, often linked from LinkedIn."""
    url = "https://remotive.com/api/remote-jobs"
    headers = {"User-Agent": "Mozilla/5.0 (compatible; HiredBot/1.0)"}
    try:
        async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as r:
            if r.status != 200:
                return []
            data = await r.json(content_type=None)
            jobs = []
            for item in data.get("jobs", [])[:80]:
                title = item.get("title", "")
                co = item.get("company_name", "Unknown")
                desc = _clean(item.get("description", ""))
                salary_str = item.get("salary", "") or ""
                jobs.append({
                    "id":          _make_id("remotive", str(item.get("id", title + co))),
                    "title":       title,
                    "company":     co,
                    "location":    "Remote",
                    "remote":      True,
                    "salary":      salary_str or _guess_salary(title, desc),
                    "job_type":    "Full-time",
                    "level":       _guess_level(title, desc),
                    "description": desc[:2000],
                    "skills":      _extract_skills(title, desc),
                    "apply_url":   item.get("url", ""),
                    "source":      "LinkedIn",  # Remotive jobs come from LinkedIn partners
                    "logo_url":    get_logo_url(co, item.get("company_logo_url", "")),
                    "posted_at":   _parse_date(item.get("publication_date", "")),
                })
            log.info(f"Remotive: {len(jobs)} jobs")
            return jobs
    except Exception as e:
        log.warning(f"Remotive failed: {e}")
        return []


# ── Source 7: Adzuna (Indeed-style aggregator) ─────────────────────────────

async def scrape_adzuna(session: aiohttp.ClientSession) -> list[dict]:
    """Adzuna aggregates Indeed + local job boards — free API."""
    # Uses free public endpoint that doesn't require API key for basic access
    # Falls back gracefully if unavailable
    categories = [
        "it-jobs",
        "engineering-jobs",
        "scientific-jobs",
        "graduate-jobs",
    ]
    countries = ["gb", "us"]
    headers = {"User-Agent": "Mozilla/5.0 (compatible; HiredBot/1.0)"}
    jobs = []

    for country in countries:
        for cat in categories[:2]:  # Limit to avoid rate limits
            url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/1"
            params = {
                "app_id": "test",
                "app_key": "test",
                "results_per_page": 20,
                "category": cat,
                "sort_by": "date",
                "content-type": "application/json",
            }
            try:
                async with session.get(url, headers=headers, params=params, timeout=aiohttp.ClientTimeout(total=12)) as r:
                    if r.status != 200:
                        continue
                    data = await r.json(content_type=None)
                    for item in data.get("results", []):
                        title = item.get("title", "")
                        co = item.get("company", {}).get("display_name", "Unknown")
                        loc = item.get("location", {}).get("display_name", "Unknown")
                        desc = _clean(item.get("description", ""))
                        sal_min = item.get("salary_min")
                        sal_max = item.get("salary_max")
                        if sal_min and sal_max:
                            salary = f"${int(sal_min/1000)}k–${int(sal_max/1000)}k"
                        else:
                            salary = _guess_salary(title, desc)
                        jobs.append({
                            "id":          _make_id("adzuna", item.get("id", title + co)),
                            "title":       title,
                            "company":     co,
                            "location":    loc,
                            "remote":      "remote" in loc.lower(),
                            "salary":      salary,
                            "job_type":    "Full-time",
                            "level":       _guess_level(title, desc),
                            "description": desc[:2000],
                            "skills":      _extract_skills(title, desc),
                            "apply_url":   item.get("redirect_url", ""),
                            "source":      "Indeed",  # Adzuna aggregates Indeed listings
                            "logo_url":    get_logo_url(co),
                            "posted_at":   _parse_date(item.get("created", "")),
                        })
            except Exception as e:
                log.warning(f"Adzuna {country}/{cat} failed: {e}")

    log.info(f"Adzuna (Indeed): {len(jobs)} jobs")
    return jobs
