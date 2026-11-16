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
export const jobs = {
  async search({ q = '', location = '', job_type = '', level = '', remote = null, source = '', page = 1, page_size = 20 } = {}) {
    const params = new URLSearchParams();
    if (q)        params.set('q', q);
    if (location) params.set('location', location);
    if (job_type) params.set('job_type', job_type);
    if (level)    params.set('level', level);
    if (remote !== null) params.set('remote', remote);
    if (source)   params.set('source', source);
    params.set('page', page);
    params.set('page_size', page_size);
    return apiFetch(`/jobs?${params}`);
  },

  async get(id) { return apiFetch(`/jobs/${id}`); },

  async sources() { return apiFetch('/jobs/sources'); },

  async match(jobId, userProfile) {
    return apiFetch(`/jobs/${jobId}/match`, {
      method: 'POST',
      body: JSON.stringify(userProfile),
    });
  },

  async summarize(jobId) {
    return apiFetch(`/jobs/${jobId}/summarize`, { method: 'POST' });
  },

  async triggerScrape() {
    return apiFetch('/jobs/scrape/trigger', { method: 'POST' });
  },
};

// ── AI Features ────────────────────────────────────────────────
export const ai = {
  async analyzeCV(cvText, jobDescription = '') {
    return apiFetch('/ai/cv/analyze', {
      method: 'POST',
      body: JSON.stringify({ cv_text: cvText, job_description: jobDescription }),
    });
  },

  async generateCoverLetter(userProfile, job, tone = 'professional') {
    const data = await apiFetch('/ai/cover-letter/generate', {
      method: 'POST',
      body: JSON.stringify({ user_profile: userProfile, job, tone }),
    });
    return data.cover_letter;
  },

  async getInterviewQuestions(role, difficulty = 'standard', focus = ['Behavioral', 'Technical']) {
    const data = await apiFetch('/ai/interview/questions', {
      method: 'POST',
      body: JSON.stringify({ role, difficulty, focus }),
    });
    return data.questions;
  },

  async scoreAnswer(question, answer, role) {
    return apiFetch('/ai/interview/score-answer', {
      method: 'POST',
      body: JSON.stringify({ question, answer, role }),
    });
  },

  async saveInterviewSession(sessionData) {
    return apiFetch('/ai/interview/save-session', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  },

  async analyzeSalary(role, location, experienceYears, skills) {
    return apiFetch('/ai/salary/analyze', {
      method: 'POST',
      body: JSON.stringify({ role, location, experience_years: experienceYears, skills }),
    });
  },

  async chat(messages, userProfile = {}) {
    const data = await apiFetch('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, user_profile: userProfile }),
    });
    return data.reply;
  },

  async matchScore(userProfile, job) {
    return apiFetch('/ai/match', {
      method: 'POST',
      body: JSON.stringify({ user_profile: userProfile, job }),
    });
  },

  async generateCV(profile) {
    return apiFetch('/ai/cv/generate', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  },

  async getCompanyDetails(companyName, jobTitle = '') {
    return apiFetch('/ai/company/details', {
      method: 'POST',
      body: JSON.stringify({ company_name: companyName, job_title: jobTitle }),
    });
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
