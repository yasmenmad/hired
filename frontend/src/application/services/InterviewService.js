/**
 * APPLICATION LAYER — Interview Domain Service
 */
import { InterviewSession } from '../../domain/entities/InterviewSession';

export const INTERVIEW_QUESTIONS = [
  { q: 'Walk me through your background and what led you to specialise in this field.', tip: 'Start with a concise story — 2 min max. Focus on the arc, not every detail.', type: 'INTRO' },
  { q: 'Tell me about a time you solved a technically complex problem under pressure.', tip: 'Use STAR: Situation, Task, Action, Result. Quantify impact where possible.', type: 'BEHAVIORAL' },
  { q: 'How would you design a real-time collaborative editing system from scratch?', tip: 'Think aloud. Discuss trade-offs, not just your final answer.', type: 'SYSTEM DESIGN' },
  { q: 'What do you consider your biggest professional failure, and what did you learn?', tip: 'Be genuine. Interviewers value self-awareness over perfection.', type: 'BEHAVIORAL' },
  { q: 'Where do you see the field heading in the next 5 years, and how are you preparing?', tip: 'Show curiosity and initiative. Reference specific trends or research.', type: 'VISION' },
];

export const FEEDBACK_ITEMS = [
  { t: 'Strong opening',   b: 'Good structured narrative. Add 1-2 quantified outcomes for greater impact.' },
  { t: 'Clarity',          b: 'Very clear communication. The key point came through consistently.' },
  { t: 'Depth',            b: "Apply the 'So what?' test — push beyond what you did to why it mattered." },
  { t: 'Pacing',           b: 'Good rhythm. Aim for 90-120 seconds per behavioural question.' },
];

export class InterviewService {
  createSession(role) {
    return new InterviewSession({
      id:        Date.now(),
      role,
      questions: INTERVIEW_QUESTIONS,
    });
  }

  submitAnswer(session, answerText) {
    return session.addAnswer(answerText);
  }

  scoreSession(session) {
    return session.calculateScore();
  }
}
