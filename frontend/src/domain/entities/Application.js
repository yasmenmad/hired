/**
 * DOMAIN LAYER — Application Entity
 * Represents a job application in the candidate's tracker.
 */
export const APPLICATION_STAGES = {
  SAVED:     'saved',
  APPLIED:   'applied',
  SCREENING: 'screening',
  INTERVIEW: 'interview',
  OFFER:     'offer',
};

export class Application {
  constructor({ id, jobTitle, company, stage, matchScore, appliedDate, notes = '' }) {
    this.id          = id;
    this.jobTitle    = jobTitle;
    this.company     = company;
    this.stage       = stage;
    this.matchScore  = matchScore;
    this.appliedDate = appliedDate;
    this.notes       = notes;
  }

  advance() {
    const order = Object.values(APPLICATION_STAGES);
    const idx   = order.indexOf(this.stage);
    if (idx < order.length - 1) {
      return new Application({ ...this, stage: order[idx + 1] });
    }
    return this;
  }

  isActive()  { return this.stage !== APPLICATION_STAGES.SAVED; }
  hasOffer()  { return this.stage === APPLICATION_STAGES.OFFER; }
}
