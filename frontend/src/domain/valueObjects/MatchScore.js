/**
 * DOMAIN LAYER — MatchScore Value Object
 */
export class MatchScore {
  constructor(value) {
    if (value < 0 || value > 100) throw new Error('MatchScore must be 0-100');
    this.value = value;
  }

  get label() {
    if (this.value >= 90) return 'Excellent match';
    if (this.value >= 80) return 'Strong match';
    if (this.value >= 70) return 'Good match';
    return 'Partial match';
  }

  get color() {
    if (this.value >= 90) return 'var(--g)';
    if (this.value >= 75) return 'var(--v500)';
    return 'var(--am)';
  }

  toString() { return `${this.value}%`; }
}
