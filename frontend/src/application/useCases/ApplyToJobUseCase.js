/**
 * APPLICATION LAYER — ApplyToJob Use Case
 */
import { Application, APPLICATION_STAGES } from '../../domain/entities/Application';

export class ApplyToJobUseCase {
  constructor(applicationRepository, notificationPort) {
    this.applicationRepository = applicationRepository;
    this.notificationPort      = notificationPort;
  }

  async execute(job, { coverLetter = '', availability = 'Immediately' } = {}) {
    const application = new Application({
      id:          Date.now(),
      jobTitle:    job.title,
      company:     job.company,
      stage:       APPLICATION_STAGES.APPLIED,
      matchScore:  job.matchScore,
      appliedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      notes:       coverLetter,
    });

    await this.applicationRepository.save(application);
    this.notificationPort.notify(`Applied to ${job.title} at ${job.company}`);
    return application;
  }
}
