/**
 * DOMAIN LAYER — Job Repository Interface (Port)
 * Defines WHAT operations exist. Infrastructure implements HOW.
 */
export class IJobRepository {
  async getAll()           { throw new Error('Not implemented'); }
  async getById(id)        { throw new Error('Not implemented'); }
  async search(query)      { throw new Error('Not implemented'); }
  async filter(criteria)   { throw new Error('Not implemented'); }
}
