import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { allQuestions, parseTask, tasks } from './content';
import { correctAnswer, decodeProgress, finishAttempt, freshProgress, recordResponse, sample, unlocked, type Attempt } from './engine';

describe('Integridad de los cinco archivos fuente', () => {
  it('extrae exactamente las 300 preguntas con sus identificadores', () => {
    expect(tasks.map(t => t.questions.length)).toEqual([120, 36, 24, 36, 84]);
    expect(new Set(allQuestions.map(q => q.id)).size).toBe(300);
    for (const t of tasks) {
      const lines = readFileSync(t.source, 'utf8').split(/\r?\n/);
      expect(t.questions.map(q => q.id)).toEqual(Array.from({ length: t.questions.length }, (_, i) => String(t.id * 1000 + i + 1)));
      for (const q of t.questions) {
        expect(lines[q.line - 1]).toContain(q.prompt);
        expect(lines.slice(q.line).find(line => line.trim())).toBe(`- ${t.id === 5 ? '**' : ''}${q.answer}${t.id === 5 ? '**' : ''}`);
        expect(t.units.find(u => u.id === q.unitId)?.questionIds).toContain(q.id);
      }
    }
  });
  it('no inventa alternativas ni corrige la discrepancia 060/60', () => {
    expect(allQuestions.find(q => q.id === '1091')?.answer).toBe('60.');
    expect(tasks[1].questions.every(q => q.options.join(',') === 'Verdadero,Falso')).toBe(true);
    expect(allQuestions.filter(q => q.taskId !== 2).every(q => q.options.length === 0)).toBe(true);
  });
  it('preserva encabezados de distintos niveles, notas finales y texto sin artefactos de chat', () => {
    expect(tasks[2].units.find(u => u.title === 'Andalucía')?.parentId).toBeTruthy();
    expect(tasks[4].units.some(u => u.title.includes('Conducir'))).toBe(true);
    expect(tasks[0].units.at(-1)?.markdown).toContain('Zarzuela');
    expect(tasks.flatMap(t => t.units).every(u => !u.markdown.includes(':chatgpt-content-reference'))).toBe(true);
  });
  it('rechaza respuestas ausentes, IDs duplicados y formatos ambiguos', () => {
    expect(() => parseTask('1 (1001). Pregunta\n\n', 1)).toThrow();
    expect(() => parseTask('1 (1001). A\n- Sí\n2 (1001). B\n- No', 1)).toThrow();
    expect(() => parseTask('1 (1001): A\n- Sí', 1)).toThrow();
  });
});
describe('Motor determinista y progreso', () => {
  const q = allQuestions.find(q => q.id === '3002')!;
  const attempt = (score: number, mode: Attempt['mode'] = 'exam', taskId = 1): Attempt => ({ id: `${mode}-${score}-${taskId}`, taskId, mode, date: new Date().toISOString(), score, total: 20, responses: Array.from({ length: 20 }, (_, i) => ({ questionId: String(taskId * 1000 + i + 1), input: 'texto', correct: i < score, expected: 'original' })) });
  it('normaliza solo tipografía, manteniendo cifras y tildes', () => {
    expect(correctAnswer(q, '  VALENCIA! ')).toBe(true);
    expect(correctAnswer(q, 'Valencia ciudad')).toBe(false);
    expect(correctAnswer({ ...q, answer: '0,5 g/l.' }, '05 g/l')).toBe(false);
    expect(correctAnswer({ ...q, answer: '60.' }, '060')).toBe(false);
    expect(correctAnswer({ ...q, answer: 'Mérida.' }, 'Merida')).toBe(false);
  });
  it('muestrea sin repeticiones ni mutación, limitando al tamaño disponible', () => {
    const input = [1, 2, 3, 4];
    expect(sample(input, 20, () => 0)).toEqual([2, 3, 4, 1]);
    expect(input).toEqual([1, 2, 3, 4]);
    expect(new Set(sample(allQuestions, 20)).size).toBe(20);
  });
  it('exige 80%, examen completo y progresión ordenada; práctica no desbloquea', () => {
    expect(finishAttempt(freshProgress(), attempt(15)).passed).toEqual([]);
    expect(finishAttempt(freshProgress(), attempt(20, 'practice')).passed).toEqual([]);
    expect(finishAttempt(freshProgress(), attempt(20, 'exam', 2)).passed).toEqual([]);
    expect(finishAttempt(freshProgress(), { ...attempt(1), total: 1 }).passed).toEqual([]);
    const next = finishAttempt(freshProgress(), attempt(16));
    expect(next.passed).toEqual([1]); expect(unlocked(next, 2)).toBe(true); expect(unlocked(next, 3)).toBe(false);
    expect(finishAttempt(next, attempt(16)).attempts).toHaveLength(1);
    expect(finishAttempt(next, attempt(10)).best['exam-1']).toBe(.8);
    expect(finishAttempt(next, attempt(10)).passed).toEqual([1]);
  });
  it('añade y resuelve fallos; persiste el historial completo y el último punto', () => {
    const response = { questionId: q.id, input: 'Madrid', expected: q.answer, correct: false };
    const wrong = recordResponse(freshProgress(), response);
    expect(wrong.mistakes[q.id]).toEqual(response);
    expect(recordResponse(wrong, { ...response, correct: true }).mistakes[q.id]).toBeUndefined();
    const saved = { ...finishAttempt(wrong, attempt(16)), last: { taskId: 3, unitId: '3-geografia' }, read: ['3-geografia'] };
    expect(decodeProgress(JSON.stringify(saved))).toEqual(saved);
  });
  it('detecta almacenamiento corrupto o incompatible', () => {
    expect(decodeProgress(null)).toEqual(freshProgress());
    for (const raw of ['bad', 'null', '{}', '{"version":2}', JSON.stringify({ ...freshProgress(), last: { taskId: 99 } })]) expect(() => decodeProgress(raw)).toThrow();
  });
});
