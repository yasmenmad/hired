/**
 * APPLICATION LAYER — ManageApplications Use Case
 */
import { Application } from '../../domain/entities/Application';

export class ManageApplicationsUseCase {
  constructor(applicationRepository, notificationPort) {
    this.applicationRepository = applicationRepository;
    this.notificationPort      = notificationPort;
  }

  async getAll() {
    return this.applicationRepository.getAll();
  }

  async add({ jobTitle, company, stage, matchScore }) {
    const application = new Application({
      id:          Date.now(),
      jobTitle, company, stage, matchScore,
      appliedDate: 'Today',
    });
    await this.applicationRepository.save(application);
    this.notificationPort.notify('Application added');
    return application;
  }

  async remove(id) {
    await this.applicationRepository.remove(id);
    this.notificationPort.notify('Application removed');
  }
}
