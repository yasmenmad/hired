/**
 * APPLICATION LAYER — AnalyseSalary Use Case
 */
import { SalaryAnalysis } from '../../domain/entities/SalaryAnalysis';

export class AnalyseSalaryUseCase {
  constructor(notificationPort) {
    this.notificationPort = notificationPort;
  }

  async execute({ offerAmount, currency, jobTitle, company, location }) {
    const amount = parseInt(String(offerAmount).replace(/[^0-9]/g, '')) || 148000;
    // Simulate async market data fetch
    await new Promise(r => setTimeout(r, 1800));
    const analysis = new SalaryAnalysis({ offerAmount: amount, currency, jobTitle, company, location });
    this.notificationPort.notify(`Analysis complete. Counter-offer: ${analysis.formattedTarget}`);
    return analysis;
  }
}
