import { useState, useMemo } from 'react';
import { GetJobsUseCase } from '../../application/useCases/GetJobsUseCase';
import { InMemoryJobRepository } from '../../infrastructure/repositories/InMemoryJobRepository';

const repo = new InMemoryJobRepository();
const uc   = new GetJobsUseCase(repo);

export default function useJobs() {
  const allJobs = useMemo(() => uc.execute(), []);
  const [search,  setSearch]  = useState('');
  const [filters, setFilters] = useState({ type:'All', date:'', level:'', lang:'' });

  function setFilter(val, group) {
    setFilters(prev => ({ ...prev, [group]: prev[group]===val ? '' : val }));
  }

  const jobs = useMemo(() => {
    return allJobs.filter(j => {
      const q = search.toLowerCase();
      const matchSearch = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.location.toLowerCase().includes(q) || (j.skills||[]).some(s=>s.toLowerCase().includes(q));
      const matchType   = !filters.type || filters.type==='All' || j.type===filters.type || (filters.type==='Remote'&&j.location.toLowerCase().includes('remote')) || (filters.type==='Full-time (CDI)'&&j.type==='Full-time') || (filters.type==='Freelance'&&j.type==='Freelance');
      const matchLevel  = !filters.level || j.level===filters.level || (filters.level==='Senior'&&(j.level==='Senior'||j.level==='Staff')) || (filters.level==='Mid'&&j.level==='Mid') || (filters.level==='Junior'&&j.level==='Junior');
      const matchLang   = !filters.lang  || j.lang===filters.lang;
      return matchSearch && matchType && matchLevel && matchLang;
    });
  }, [allJobs, search, filters]);

  return { jobs, filters, setFilter, search, setSearch };
}
