import { JOB_SEED_DATA } from '../persistence/jobData';

export class InMemoryJobRepository {
  constructor() { this._jobs = [...JOB_SEED_DATA]; }
  findAll()          { return this._jobs; }
  findById(id)       { return this._jobs.find(j=>j.id===id)||null; }
  save(job)          { this._jobs.push(job); }
  update(id,updates) { const i=this._jobs.findIndex(j=>j.id===id); if(i>-1) this._jobs[i]={...this._jobs[i],...updates}; }
}
