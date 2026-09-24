import type { Question } from './content';
export const PASS_RATE = 0.8;
export const EXAM_SIZE = 20;
export type Mode = 'practice' | 'exam' | 'review';
export interface Response { questionId: string; input: string; correct: boolean; expected: string }
export interface Attempt { id: string; taskId: number; mode: Mode; date: string; responses: Response[]; score: number; total: number }
export interface Progress { version: 1; attempts: Attempt[]; mistakes: Record<string, Response>; passed: number[]; best: Record<string, number>; last: { taskId: number; unitId: string }; read: string[] }
export const freshProgress = (): Progress => ({ version: 1, attempts: [], mistakes: {}, passed: [], best: {}, last: { taskId: 1, unitId: '' }, read: [] });
// Only typography is normalized. No semantic guesses, synonym lists or AI.
export const normalize = (value: string) => value.normalize('NFC').toLocaleLowerCase('es').trim().replace(/[.!?…]+$/u, '').replace(/\s+/g, ' ');
export const correctAnswer = (q: Question, input: string) => normalize(input) === normalize(q.answer);
export function sample<T>(items: T[], size: number, random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result.slice(0, Math.max(0, size));
}
export const unlocked = (progress: Progress, taskId: number) => taskId === 1 || Array.from({ length: taskId - 1 }, (_, i) => i + 1).every(id => progress.passed.includes(id));
export function recordResponse(progress: Progress, response: Response): Progress {
  const mistakes = { ...progress.mistakes };
  if (response.correct) delete mistakes[response.questionId]; else mistakes[response.questionId] = response;
  return { ...progress, mistakes };
}
export function finishAttempt(progress: Progress, attempt: Attempt): Progress {
  if (progress.attempts.some(a => a.id === attempt.id)) return progress;
  let next = progress;
  for (const response of attempt.responses) next = recordResponse(next, response);
  const passed = [...next.passed];
  if (attempt.mode === 'exam' && attempt.total === EXAM_SIZE && attempt.score / attempt.total >= PASS_RATE && unlocked(progress, attempt.taskId) && !passed.includes(attempt.taskId)) passed.push(attempt.taskId);
  const key = `${attempt.mode}-${attempt.taskId}`;
  return { ...next, passed, attempts: [attempt, ...progress.attempts], best: { ...progress.best, [key]: Math.max(progress.best[key] ?? 0, attempt.score / attempt.total) } };
}
export const STORAGE_KEY = 'repasoccse.v1';
export function decodeProgress(raw: string | null): Progress {
  if (!raw) return freshProgress();
  const p = JSON.parse(raw) as Progress;
  const responseValid = (r: Response) => r && typeof r.questionId === 'string' && typeof r.input === 'string' && typeof r.expected === 'string' && typeof r.correct === 'boolean';
  if (!p || p.version !== 1 || !Array.isArray(p.attempts) || !p.attempts.every(a => a && typeof a.id === 'string' && Number.isInteger(a.taskId) && ['practice','exam','review'].includes(a.mode) && typeof a.date === 'string' && Array.isArray(a.responses) && a.responses.every(responseValid) && a.total > 0 && a.total === a.responses.length && a.score === a.responses.filter(r => r.correct).length) || !Array.isArray(p.passed) || !p.passed.every(id => Number.isInteger(id) && id >= 1 && id <= 5) || !p.mistakes || typeof p.mistakes !== 'object' || !Object.values(p.mistakes).every(responseValid) || !p.best || !Object.values(p.best).every(n => typeof n === 'number' && n >= 0 && n <= 1) || !p.last || !Number.isInteger(p.last.taskId) || p.last.taskId < 1 || p.last.taskId > 5 || typeof p.last.unitId !== 'string' || !Array.isArray(p.read) || !p.read.every(s => typeof s === 'string')) throw new Error('Progreso guardado no válido');
  return p;
}

export const availableQuestions = (questions: Question[]) => questions.filter(q => !q.choiceIssue && q.options.length >= 2);
