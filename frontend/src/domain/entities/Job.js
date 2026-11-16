/**
 * DOMAIN LAYER — Job Entity
 * Pure business object. No React. No imports. No side-effects.
 */
export class Job {
  constructor({ id, title, company, location, salary, type, level, matchScore, postedDaysAgo, description, skills, aboutCompany, color }) {
    this.id            = id;
    this.title         = title;
    this.company       = company;
    this.location      = location;
    this.salary        = salary;
    this.type          = type;
    this.level         = level;
    this.matchScore    = matchScore;
    this.postedDaysAgo = postedDaysAgo;
    this.description   = description;
    this.skills        = skills;
    this.aboutCompany  = aboutCompany;
    this.color         = color;
  }

  isRemote()        { return this.location === 'Remote'; }
  isSenior()        { return this.level === 'Senior' || this.level === 'Staff'; }
  isHighMatch()     { return this.matchScore >= 90; }
  isGoodMatch()     { return this.matchScore >= 75; }

  matchBreakdown() {
    return {
      skills:      this.matchScore,
      experience:  Math.round(this.matchScore * 0.95),
      culture:     Math.round(this.matchScore * 0.88),
    };
  }

  toPlainObject() {
    return { ...this };
  }
}
