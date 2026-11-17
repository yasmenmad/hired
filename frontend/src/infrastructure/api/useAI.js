/**
 * useAI — React hook for all Groq AI features.
 * Wraps the apiClient with loading/error state management.
 */
import { useState, useCallback } from 'react';
import { ai, checkBackend } from '../api/apiClient';

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  async function run(fn) {
    setLoading(true);
    setError(null);
    try {
      // Resilient execution with client-side edge fallbacks
      const result = await fn();
      return result;
    } catch (e) {
      setError(e.message || 'AI request failed');
      return null;
    } finally {
      setLoading(false);
    }
  }

  const analyzeCV = useCallback((cvText, jobDesc = '') =>
    run(() => ai.analyzeCV(cvText, jobDesc)), []);

  const generateCoverLetter = useCallback((profile, job, tone = 'professional') =>
    run(() => ai.generateCoverLetter(profile, job, tone)), []);

  const getInterviewQuestions = useCallback((role, difficulty = 'standard', focus = []) =>
    run(() => ai.getInterviewQuestions(role, difficulty, focus)), []);

  const scoreAnswer = useCallback((question, answer, role) =>
    run(() => ai.scoreAnswer(question, answer, role)), []);

  const analyzeSalary = useCallback((role, location, years, skills) =>
    run(() => ai.analyzeSalary(role, location, years, skills)), []);

  const chat = useCallback((messages, profile = {}) =>
    run(() => ai.chat(messages, profile)), []);

  const matchScore = useCallback((profile, job) =>
    run(() => ai.matchScore(profile, job)), []);

  return {
    loading,
    error,
    analyzeCV,
    generateCoverLetter,
    getInterviewQuestions,
    scoreAnswer,
    analyzeSalary,
    chat,
    matchScore,
  };
}

export default useAI;
