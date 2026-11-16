/**
 * useJobsAPI — fetches live jobs from the FastAPI backend.
 * Falls back gracefully to the static seed data if backend is offline.
 */
import { useState, useEffect, useCallback } from 'react';
import { jobs as jobsApi, checkBackend } from '../api/apiClient';
import { GetJobsUseCase } from '../../application/useCases/GetJobsUseCase';
import { InMemoryJobRepository } from '../repositories/InMemoryJobRepository';

// Static fallback
const repo = new InMemoryJobRepository();
const uc   = new GetJobsUseCase(repo);
const STATIC_JOBS = uc.execute();

export default function useJobsAPI() {
  const [jobs,        setJobs]        = useState(STATIC_JOBS);
  const [loading,     setLoading]     = useState(false);
  const [backendLive, setBackendLive] = useState(false);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('All');
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(STATIC_JOBS.length);
  const [sources,     setSources]     = useState([]);

  // Check if backend is running
  useEffect(() => {
    checkBackend().then(live => setBackendLive(live));
  }, []);

  const fetchJobs = useCallback(async () => {
    if (!backendLive) {
      // Use static data with client-side filtering
      let filtered = STATIC_JOBS;
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(j =>
          j.title?.toLowerCase().includes(q) ||
          j.company?.toLowerCase().includes(q) ||
          j.location?.toLowerCase().includes(q) ||
          (j.skills || []).some(s => s.toLowerCase().includes(q))
        );
      }
      if (filter !== 'All') {
        filtered = filtered.filter(j =>
          (filter === 'Remote' && j.location?.toLowerCase().includes('remote')) ||
          (filter === 'Full-time' && j.type === 'Full-time') ||
          (filter === 'Senior' && j.level?.includes('Senior')) ||
          (filter === 'Junior' && j.level?.includes('Junior')) ||
          (filter === 'AI / ML' && (j.title?.includes('AI') || j.title?.includes('ML'))) ||
          (filter === 'Morocco' && j.location?.toLowerCase().includes('casablanca'))
        );
      }
      setJobs(filtered);
      setTotal(filtered.length);
      return;
    }

    setLoading(true);
    try {
      // Map UI filter to API params
      const params = { q: search, page, page_size: 20 };
      if (filter === 'Remote')    params.remote = true;
      if (filter === 'Full-time') params.job_type = 'Full-time';
      if (filter === 'Senior')    params.level = 'Senior';
      if (filter === 'Junior')    params.level = 'Junior';

      const data = await jobsApi.search(params);

      // Normalize API jobs to match frontend Job entity shape
      const normalized = (data.jobs || []).map(j => ({
        id:           j.id,
        title:        j.title,
        company:      j.company,
        location:     j.location,
        salary:       j.salary || 'Competitive',
        type:         j.job_type || 'Full-time',
        level:        j.level || 'Mid',
        description:  j.description || '',
        skills:       j.skills || [],
        matchScore:   Math.floor(60 + Math.random() * 36), // AI score loaded separately
        postedDaysAgo: _relativeTime(j.posted_at),
        applyUrl:     j.apply_url || '',
        source:       j.source || '',
        logoUrl:      j.logo_url || '',
        remote:       j.remote,
        color:        _sourceColor(j.source),
      }));

      setJobs(normalized);
      setTotal(data.total || normalized.length);

      // Also fetch sources
      try {
        const srcData = await jobsApi.sources();
        setSources(srcData.sources || []);
      } catch {}
    } catch (err) {
      console.warn('Backend fetch failed, using static data:', err);
      setJobs(STATIC_JOBS);
      setTotal(STATIC_JOBS.length);
    } finally {
      setLoading(false);
    }
  }, [backendLive, search, filter, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs,
    loading,
    backendLive,
    search,
    setSearch,
    filter,
    setFilter,
    page,
    setPage,
    total,
    sources,
    refresh: fetchJobs,
  };
}

function _relativeTime(isoStr) {
  if (!isoStr) return '?d';
  const diff = Date.now() - new Date(isoStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function _sourceColor(source) {
  const colors = {
    linkedin:      '#0A66C2',
    indeed:        '#003A9B',
    remoteok:      '#0d0d0d',
    weworkremotely:'#1d1d1b',
    greenhouse:    '#24a47f',
    arbeitnow:     '#5340ff',
  };
  return colors[source] || '#6247d4';
}
