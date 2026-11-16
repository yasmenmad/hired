/**
 * DOMAIN LAYER — InterviewSession Entity
 */
export class InterviewSession {
  constructor({ id, role, questions, answers = [], startedAt = null }) {
    this.id        = id;
    this.role      = role;
    this.questions = questions;
    this.answers   = answers;
    this.startedAt = startedAt;
  }

  get currentIndex()   { return this.answers.length; }
  get currentQuestion(){ return this.questions[this.currentIndex] || null; }
  get isComplete()     { return this.answers.length >= this.questions.length; }
  get progress()       { return (this.answers.length / this.questions.length) * 100; }

  addAnswer(text) {
    return new InterviewSession({
      ...this,
      answers: [...this.answers, { text, timestamp: Date.now() }],
    });
  }

  calculateScore() {
    const base = 70 + Math.floor(Math.random() * 20);
    return {
      overall:       base,
      communication: Math.min(base + 4, 99),
      technicalDepth: Math.min(base - 6, 99),
      conciseness:   Math.min(base + 2, 99),
      confidence:    Math.min(base - 2, 99),
    };
  }
}
