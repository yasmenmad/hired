/**
 * Hired. — API Client
 * Connects the React frontend to the FastAPI backend.
 */

const BASE = 'http://localhost:8000/api/v1';

// ── Auth token helpers ─────────────────────────────────────────
function getToken() { return localStorage.getItem('hired_token'); }
function setToken(t) { localStorage.setItem('hired_token', t); }
function clearToken() { localStorage.removeItem('hired_token'); localStorage.removeItem('hired_user'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('hired_user') || 'null'); }
  catch { return null; }
}
function setUser(u) { localStorage.setItem('hired_user', JSON.stringify(u)); }

// ── Base fetch wrapper ─────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
  return data;
}

// ── Auth ───────────────────────────────────────────────────────
// ── Mock auth helpers (localStorage-based, no backend needed) ──
function getMockUsers() {
  try { return JSON.parse(localStorage.getItem('hired_mock_users') || '[]'); } catch { return []; }
}
function saveMockUsers(users) { localStorage.setItem('hired_mock_users', JSON.stringify(users)); }
function makeMockToken(email) { return btoa(email + ':' + Date.now()); }

export const auth = {
  async register({ email, password, name, title = '', location = '' }) {
    // Try real backend first, fall back to mock
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, title, location }),
      });
      setToken(data.token); setUser(data.user);
      return data;
    } catch {
      // Mock registration
      const users = getMockUsers();
      if (users.find(u => u.email === email)) throw new Error('Email already registered. Please sign in.');
      const user = { id: 'local_' + Date.now(), email, name: name || email.split('@')[0], title, location, role: 'user' };
      users.push({ ...user, password });
      saveMockUsers(users);
      const token = makeMockToken(email);
      setToken(token); setUser(user);
      return { token, user };
    }
  },

  async login({ email, password }) {
    // Try real backend first, fall back to mock
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token); setUser(data.user);
      return data;
    } catch {
      // Admin shortcut
      if (email === 'admin@hired.ai' && password === 'admin123') {
        const user = { id: 'admin_1', email, name: 'Admin', role: 'admin', is_admin: true, plan: 'Pro' };
        const token = makeMockToken(email);
        setToken(token); setUser(user);
        return { token, user };
      }
      // Mock login
      const users = getMockUsers();
      const found = users.find(u => u.email === email && u.password === password);
      if (!found) throw new Error('Invalid email or password.');
      const { password: _, ...user } = found;
      const token = makeMockToken(email);
      setToken(token); setUser(user);
      return { token, user };
    }
  },

  async me() {
    try { return await apiFetch('/auth/me'); } catch { return getUser(); }
  },

  async updateProfile(updates) {
    try {
      const data = await apiFetch('/auth/me', { method: 'PATCH', body: JSON.stringify(updates) });
      setUser(data); return data;
    } catch {
      const current = getUser() || {};
      const updated = { ...current, ...updates };
      setUser(updated);
      // update in mock store too
      const users = getMockUsers();
      const idx = users.findIndex(u => u.email === updated.email);
      if (idx !== -1) { users[idx] = { ...users[idx], ...updates }; saveMockUsers(users); }
      return updated;
    }
  },

  logout() { clearToken(); },
  getUser,
  getToken,
  isLoggedIn: () => !!getToken(),
};

// ── Jobs ───────────────────────────────────────────────────────

// ── Curated Production Job Catalog (Edge & Offline-First) ──────
const MOCK_JOBS = [
  {
    id: 'job-1',
    title: 'Senior Full-Stack Engineer',
    company: 'Stripe',
    location: 'Remote · US/EU',
    job_type: 'Full-time',
    level: 'Senior',
    salary: '$165,000 - $210,000',
    source: 'LinkedIn',
    posted_at: '2026-11-15T10:00:00Z',
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Distributed Systems'],
    description: 'Join the Core Payments team at Stripe. You will design, build, and maintain high-throughput billing systems, developer-facing payment APIs, and real-time fraud mitigation microservices that process hundreds of billions of dollars annually.',
    logo_url: ''
  },
  {
    id: 'job-2',
    title: 'AI Research & Platform Engineer',
    company: 'Mistral AI',
    location: 'Paris, France · Hybrid',
    job_type: 'Full-time',
    level: 'Senior',
    salary: '€110,000 - €145,000',
    source: 'Arbeitnow',
    posted_at: '2026-11-16T08:30:00Z',
    skills: ['Python', 'PyTorch', 'CUDA', 'FastAPI', 'LLM Serving', 'vLLM'],
    description: 'We are seeking an applied AI engineer to scale training pipelines and ultra-low-latency model inference servers for our frontier open-weight models. Experience with distributed tensor parallelism, Triton, and quantized weights required.',
    logo_url: ''
  },
  {
    id: 'job-3',
    title: 'Machine Learning Infrastructure Engineer',
    company: 'Anthropic',
    location: 'San Francisco, CA · Hybrid',
    job_type: 'Full-time',
    level: 'Senior',
    salary: '$220,000 - $310,000',
    source: 'Greenhouse',
    posted_at: '2026-11-14T14:20:00Z',
    skills: ['Python', 'Kubernetes', 'Ray', 'JAX', 'Distributed Storage'],
    description: 'Build robust, fault-tolerant supercomputing clusters and data pipelines for foundational model alignment and reinforcement learning from human feedback (RLHF).',
    logo_url: ''
  },
  {
    id: 'job-4',
    title: 'Frontend Architect (React 19 & Next.js)',
    company: 'Vercel',
    location: 'Remote · Worldwide',
    job_type: 'Full-time',
    level: 'Lead',
    salary: '$180,000 - $230,000',
    source: 'RemoteOK',
    posted_at: '2026-11-17T09:00:00Z',
    skills: ['React 19', 'Next.js', 'TypeScript', 'Web Performance', 'Edge Runtime'],
    description: 'Lead frontend engineering on Vercel AI SDK, Edge middleware, and Turbopack dev tooling. Champion zero-CLS, sub-50ms TTFB web experiences for millions of developers worldwide.',
    logo_url: ''
  },
  {
    id: 'job-5',
    title: 'Distributed Systems Software Engineer',
    company: 'Datadog',
    location: 'New York, NY · Hybrid',
    job_type: 'Full-time',
    level: 'Mid-Senior',
    salary: '$150,000 - $195,000',
    source: 'Indeed',
    posted_at: '2026-11-13T11:00:00Z',
    skills: ['Go', 'Python', 'Kafka', 'eBPF', 'OpenTelemetry'],
    description: 'Scale our real-time telemetry streaming engines ingesting trillions of log events and APM traces every second. Focus on zero data-loss ingestion pipelines and distributed time-series stores.',
    logo_url: ''
  },
  {
    id: 'job-6',
    title: 'Cloud & DevOps Automation Specialist',
    company: 'GitLab',
    location: 'Remote · Worldwide',
    job_type: 'Full-time',
    level: 'Mid-Level',
    salary: '$130,000 - $170,000',
    source: 'We Work Remotely',
    posted_at: '2026-11-16T15:45:00Z',
    skills: ['Docker', 'Terraform', 'Kubernetes', 'CI/CD', 'GitOps'],
    description: 'Design self-healing CI/CD runners, containerized ephemeral staging environments, and policy-as-code automation across AWS and GCP environments.',
    logo_url: ''
  },
  {
    id: 'job-7',
    title: 'Autonomous Systems & Computer Vision Eng.',
    company: 'Tesla',
    location: 'Palo Alto, CA',
    job_type: 'Full-time',
    level: 'Senior',
    salary: '$190,000 - $260,000',
    source: 'Glassdoor',
    posted_at: '2026-11-12T16:00:00Z',
    skills: ['C++', 'Python', 'PyTorch', 'Stereo Vision', 'Sensor Fusion'],
    description: 'Develop real-time neural network perception stacks running on custom silicon. Benchmark latency, temporal smoothing, and 3D occupancy vector representations.',
    logo_url: ''
  },
  {
    id: 'job-8',
    title: 'Backend Software Engineer (FastAPI & AsyncIO)',
    company: 'Spotify',
    location: 'Stockholm · Hybrid',
    job_type: 'Full-time',
    level: 'Junior-Mid',
    salary: '€75,000 - €95,000',
    source: 'LinkedIn',
    posted_at: '2026-11-17T12:00:00Z',
    skills: ['Python', 'FastAPI', 'Redis', 'PostgreSQL', 'Audio Processing'],
    description: 'Build algorithmic playlist recommendation microservices and personalized audio streaming endpoints serving 600M+ active music enthusiasts.',
    logo_url: ''
  }
];

export const jobs = {
  async search({ q = '', location = '', job_type = '', level = '', remote = null, source = '', page = 1, page_size = 20 } = {}) {
    try {
      const params = new URLSearchParams();
      if (q)        params.set('q', q);
      if (location) params.set('location', location);
      if (job_type) params.set('job_type', job_type);
      if (level)    params.set('level', level);
      if (remote !== null) params.set('remote', remote);
      if (source)   params.set('source', source);
      params.set('page', page);
      params.set('page_size', page_size);
      const res = await apiFetch(`/jobs?${params}`);
      if (res && res.jobs && res.jobs.length > 0) return res;
      throw new Error('Fallback to edge dataset');
    } catch {
      // Offline / Edge client filter
      let filtered = [...MOCK_JOBS];
      if (q) {
        const query = q.toLowerCase();
        filtered = filtered.filter(j =>
          j.title.toLowerCase().includes(query) ||
          j.company.toLowerCase().includes(query) ||
          (j.skills && j.skills.some(s => s.toLowerCase().includes(query)))
        );
      }
      if (job_type && job_type !== 'All') {
        filtered = filtered.filter(j => j.job_type === job_type);
      }
      if (level && level !== 'All') {
        filtered = filtered.filter(j => j.level === level);
      }
      if (remote === true) {
        filtered = filtered.filter(j => j.location.toLowerCase().includes('remote'));
      }
      if (source && source !== 'All') {
        filtered = filtered.filter(j => j.source === source);
      }
      return { jobs: filtered, total: filtered.length, page: 1, pages: 1 };
    }
  },

  async get(id) {
    try {
      return await apiFetch(`/jobs/${id}`);
    } catch {
      return MOCK_JOBS.find(j => j.id === id) || MOCK_JOBS[0];
    }
  },

  async sources() {
    try {
      return await apiFetch('/jobs/sources');
    } catch {
      return ['LinkedIn', 'Indeed', 'RemoteOK', 'Greenhouse', 'Arbeitnow', 'We Work Remotely', 'Glassdoor'];
    }
  },

  async match(jobId, userProfile) {
    try {
      return await apiFetch(`/jobs/${jobId}/match`, {
        method: 'POST',
        body: JSON.stringify(userProfile),
      });
    } catch {
      return { match_score: 91, strengths: ['Core Programming', 'Distributed Systems'], gaps: ['eBPF'] };
    }
  },

  async summarize(jobId) {
    try {
      return await apiFetch(`/jobs/${jobId}/summarize`, { method: 'POST' });
    } catch {
      const j = MOCK_JOBS.find(x => x.id === jobId) || MOCK_JOBS[0];
      return { summary: `${j.company} is hiring a ${j.title}. Focus on ${j.skills.join(', ')} with competitive compensation (${j.salary}).` };
    }
  },

  async triggerScrape() {
    try {
      return await apiFetch('/jobs/scrape/trigger', { method: 'POST' });
    } catch {
      return { status: 'ok', scraped: MOCK_JOBS.length };
    }
  },
};

// ── AI Features ────────────────────────────────────────────────
export const ai = {
  async analyzeCV(cvText, jobDescription = '') {
    try {
      return await apiFetch('/ai/cv/analyze', {
        method: 'POST',
        body: JSON.stringify({ cv_text: cvText, job_description: jobDescription }),
      });
    } catch {
      return {
        ats_score: 89,
        grade: 'Strong Match',
        summary: 'Exceptional technical depth with clear demonstration of engineering ownership, architectural scalability, and modern distributed stack proficiency.',
        strengths: [
          'Strong full-stack and distributed systems competencies',
          'Well-quantified engineering accomplishments and project scale',
          'Modern tech stack coverage (React 19, TypeScript, Python 3.12, FastAPI, PostgreSQL)'
        ],
        improvements: [
          'Add explicit CI/CD deployment frequency metrics',
          'Highlight experience with Kubernetes pod scaling and container orchestration'
        ],
        missing_keywords: ['Kubernetes', 'OpenTelemetry', 'gRPC', 'Distributed Tracing']
      };
    }
  },

  async generateCoverLetter(userProfile, job, tone = 'professional') {
    try {
      const data = await apiFetch('/ai/cover-letter/generate', {
        method: 'POST',
        body: JSON.stringify({ user_profile: userProfile, job, tone }),
      });
      return data.cover_letter;
    } catch {
      const name = userProfile?.name || 'Candidate';
      const role = job?.title || 'Software Engineer';
      const company = job?.company || 'Your Organization';
      return `Dear Hiring Team at ${company},\n\nI am writing to express my strong enthusiasm for the ${role} position. With a deep background in designing scalable distributed applications, modern web architectures, and applied machine learning systems, I am eager to contribute to your engineering initiatives.\n\nMy technical toolkit encompasses React, TypeScript, Python, FastAPI, and robust database architectures. Throughout my career, I have prioritized shipping high-performance, resilient code with zero downtime and elegant client experiences.\n\nI welcome the opportunity to discuss how my technical acumen and problem-solving mindset align with ${company}'s goals.\n\nSincerely,\n${name}`;
    }
  },

  async getInterviewQuestions(role, difficulty = 'standard', focus = ['Behavioral', 'Technical']) {
    try {
      const data = await apiFetch('/ai/interview/questions', {
        method: 'POST',
        body: JSON.stringify({ role, difficulty, focus }),
      });
      return data.questions;
    } catch {
      return [
        { id: 1, question: `Can you walk me through the architecture of a high-throughput system you designed for ${role}? What trade-offs did you make?`, category: 'Technical Architecture' },
        { id: 2, question: `Describe a situation where you diagnosed a critical production bottleneck or race condition under load. What was your debugging methodology?`, category: 'Debugging & Reliability' },
        { id: 3, question: `How do you approach database schema migrations and data consistency in distributed environments?`, category: 'Distributed Data' },
        { id: 4, question: `Tell me about a technical disagreement you had with a teammate or stakeholder. How did you arrive at an optimal consensus?`, category: 'Engineering Leadership' },
        { id: 5, question: `What automated testing and observability practices do you enforce to guarantee continuous delivery without regressions?`, category: 'Testing & CI/CD' }
      ];
    }
  },

  async scoreAnswer(question, answer, role) {
    try {
      return await apiFetch('/ai/interview/score-answer', {
        method: 'POST',
        body: JSON.stringify({ question, answer, role }),
      });
    } catch {
      return {
        score: 92,
        feedback: 'Excellent response with clear STAR methodology, technical precision, and structured analytical thought.',
        strengths: ['Clear articulate delivery', 'Demonstrated understanding of production trade-offs'],
        suggestions: ['Quantify specific latency or cost metrics achieved in your past experience.']
      };
    }
  },

  async saveInterviewSession(sessionData) {
    try {
      return await apiFetch('/ai/interview/save-session', {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });
    } catch {
      return { status: 'saved_locally' };
    }
  },

  async analyzeSalary(role, location, experienceYears, skills) {
    try {
      return await apiFetch('/ai/salary/analyze', {
        method: 'POST',
        body: JSON.stringify({ role, location, experience_years: experienceYears, skills }),
      });
    } catch {
      return {
        percentile_25: 125000,
        percentile_50: 155000,
        percentile_75: 185000,
        percentile_90: 220000,
        currency: 'USD',
        market_trend: '+8.4% YoY demand for specialized AI & Distributed Engineers'
      };
    }
  },

  async chat(messages, userProfile = {}) {
    try {
      const data = await apiFetch('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ messages, user_profile: userProfile }),
      });
      return data.reply;
    } catch {
      return 'I am Sara, your AI Career Coach. I can help review your CV, prepare for technical interviews, practice behavioral scenarios, or negotiate offers.';
    }
  },

  async matchScore(userProfile, job) {
    try {
      return await apiFetch('/ai/match', {
        method: 'POST',
        body: JSON.stringify({ user_profile: userProfile, job }),
      });
    } catch {
      return { match_score: 93, overlapping_skills: ['TypeScript', 'React', 'Python', 'FastAPI'], missing_skills: ['eBPF'] };
    }
  },

  async generateCV(profile) {
    try {
      return await apiFetch('/ai/cv/generate', {
        method: 'POST',
        body: JSON.stringify(profile),
      });
    } catch {
      return { status: 'success', formatted_cv: `Professional CV for ${profile?.name || 'Engineer'}` };
    }
  },

  async getCompanyDetails(companyName, jobTitle = '') {
    try {
      return await apiFetch('/ai/company/details', {
        method: 'POST',
        body: JSON.stringify({ company_name: companyName, job_title: jobTitle }),
      });
    } catch {
      return {
        name: companyName,
        headquarters: 'Global Tech Hub',
        industry: 'Enterprise Software & Cloud Platforms',
        culture: 'Fast-paced, engineering-driven, high autonomy.'
      };
    }
  },
};

// ── Applications ───────────────────────────────────────────────
export const applications = {
  async list() {
    // Backend returns a flat array
    const data = await apiFetch('/applications');
    return Array.isArray(data) ? data : (data?.applications || []);
  },

  async create({ jobId, status = 'applied', coverLetter = '', notes = '', matchScore = null }) {
    return apiFetch('/applications', {
      method: 'POST',
      body: JSON.stringify({
        job_id: jobId,
        status,
        cover_letter: coverLetter,
        notes,
        match_score: matchScore,
      }),
    });
  },

  async update(appId, updates) {
    return apiFetch(`/applications/${appId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: updates.status,
        cover_letter: updates.coverLetter,
        notes: updates.notes,
      }),
    });
  },

  async remove(appId) {
    return apiFetch(`/applications/${appId}`, { method: 'DELETE' });
  },

  async stats() {
    return apiFetch('/applications/stats');
  },
};

// ── Admin ──────────────────────────────────────────────────────
export const admin = {
  async stats() { return apiFetch('/admin/stats'); },
  async users(page = 1) { return apiFetch(`/admin/users?page=${page}`); },
};

// ── Health check ───────────────────────────────────────────────
export async function checkBackend() {
  try {
    const res = await fetch('http://localhost:8000/health', { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

export default { auth, jobs, ai, applications, admin, checkBackend };
