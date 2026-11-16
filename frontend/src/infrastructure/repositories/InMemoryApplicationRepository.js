/**
 * INFRASTRUCTURE LAYER — InMemoryApplicationRepository
 */
import { IApplicationRepository } from '../../domain/repositories/IApplicationRepository';
import { Application } from '../../domain/entities/Application';

const SEED = [
  { id:1, jobTitle:'Senior AI Engineer',   company:'Anthropic', stage:'applied',   matchScore:96, appliedDate:'Mar 14' },
  { id:2, jobTitle:'ML Platform Engineer', company:'OpenAI',    stage:'screening', matchScore:91, appliedDate:'Mar 12' },
  { id:3, jobTitle:'Staff Engineer',       company:'Vercel',    stage:'interview', matchScore:85, appliedDate:'Mar 10' },
  { id:4, jobTitle:'Full Stack Engineer',  company:'Linear',    stage:'saved',     matchScore:88, appliedDate:'Mar 15' },
  { id:5, jobTitle:'Data Scientist',       company:'Stripe',    stage:'offer',     matchScore:79, appliedDate:'Mar 8'  },
  { id:6, jobTitle:'Product Designer',     company:'Figma',     stage:'applied',   matchScore:82, appliedDate:'Mar 13' },
];

export class InMemoryApplicationRepository extends IApplicationRepository {
  constructor() {
    super();
    this._apps = SEED.map(d => new Application(d));
  }

  async getAll() { return [...this._apps]; }

  async save(application) {
    const idx = this._apps.findIndex(a => a.id === application.id);
    if (idx >= 0) { this._apps[idx] = application; }
    else          { this._apps.push(application); }
    return application;
  }

  async remove(id) {
    this._apps = this._apps.filter(a => a.id !== id);
  }

  async update(application) {
    return this.save(application);
  }
}
