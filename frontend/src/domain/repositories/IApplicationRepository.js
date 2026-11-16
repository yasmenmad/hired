/**
 * DOMAIN LAYER — Application Repository Interface
 */
export class IApplicationRepository {
  async getAll()           { throw new Error('Not implemented'); }
  async save(application)  { throw new Error('Not implemented'); }
  async remove(id)         { throw new Error('Not implemented'); }
  async update(application){ throw new Error('Not implemented'); }
}
