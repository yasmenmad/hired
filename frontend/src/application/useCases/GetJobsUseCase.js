export class GetJobsUseCase {
  constructor(repo) { this.repo = repo; }
  execute(filters={}) { return this.repo.findAll(); }
}
