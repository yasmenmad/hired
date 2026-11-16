/**
 * APPLICATION LAYER — Skills Test Domain Service
 */
export const TEST_QUESTIONS = [
  { q: 'Which data structure provides O(1) average-case lookup, insertion, and deletion?', opts: ['Array', 'Hash Map', 'Binary Search Tree', 'Linked List'], ans: 1 },
  { q: 'What is the time complexity of merge sort?', opts: ['O(n2)', 'O(n log n)', 'O(log n)', 'O(n)'], ans: 1 },
  { q: 'In React, when should you use useCallback?', opts: ['Always to optimise performance', 'When passing callbacks to memoised child components', 'When you need async operations', 'For every function in a component'], ans: 1 },
  { q: 'What does SOLID stand for in software engineering?', opts: ['A design pattern', 'A set of 5 OOP principles', 'A testing framework', 'A version control strategy'], ans: 1 },
  { q: 'Which HTTP method is idempotent?', opts: ['POST', 'PUT', 'PATCH', 'All of the above'], ans: 1 },
];

export class SkillsTestService {
  getQuestions() { return TEST_QUESTIONS; }

  grade(answers) {
    const correct = answers.filter((a, i) => a === TEST_QUESTIONS[i]?.ans).length;
    const score   = Math.round((correct / TEST_QUESTIONS.length) * 100);
    return {
      score, correct,
      total:  TEST_QUESTIONS.length,
      grade:  score >= 80 ? 'Excellent' : score >= 60 ? 'Proficient' : 'Needs improvement',
      breakdown: {
        communication:  Math.min(score + 5, 99),
        problemSolving: Math.min(score - 4, 99),
        codeQuality:    Math.min(score + 2, 99),
        systemDesign:   Math.min(score - 7, 99),
      },
    };
  }
}
