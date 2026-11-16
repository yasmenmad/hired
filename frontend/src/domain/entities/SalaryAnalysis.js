/**
 * DOMAIN LAYER — SalaryAnalysis Value Object
 * Pure domain logic for salary negotiation calculations.
 */
export class SalaryAnalysis {
  constructor({ offerAmount, currency, jobTitle, company, location }) {
    this.offerAmount = offerAmount;
    this.currency    = currency;
    this.jobTitle    = jobTitle;
    this.company     = company;
    this.location    = location;
  }

  get marketFloor()    { return Math.round(this.offerAmount * 0.87); }
  get marketMedian()   { return this.offerAmount; }
  get counterTarget()  { return Math.round(this.offerAmount * 1.115); }

  get negotiationGap() { return this.counterTarget - this.offerAmount; }

  format(amount) {
    return `${this.currency}${amount >= 1000 ? (amount / 1000).toFixed(0) + 'k' : amount}`;
  }

  get formattedFloor()   { return this.format(this.marketFloor); }
  get formattedMedian()  { return this.format(this.marketMedian); }
  get formattedTarget()  { return this.format(this.counterTarget); }

  get counterScript() {
    return `Thank you for the offer. Based on current market rates for ${this.jobTitle} roles and my track record, I was expecting a base closer to ${this.formattedTarget}. Is there flexibility there?`;
  }

  get negotiationTips() {
    return [
      '85% of employers expect negotiation and have room to move. Always ask.',
      'Anchor high — start at your target and let them meet you in the middle.',
      'Never give the first number; ask what budget they have allocated for the role.',
      'Bundle your ask: base salary, equity, sign-on bonus, and remote flexibility together.',
    ];
  }
}
