import { parseSourceAnswer } from './questionBank';
import { describe, expect, it } from 'vitest';
import { resolvePracticeOptions } from './choices';
import { allQuestions } from './content';
import { availableQuestions, correctAnswer } from './engine';

describe('Regresión: editar el banco no deja la web en blanco', () => {
  it('mantiene la corrección 060 del usuario y sus alternativas válidas', () => {
    const q=allQuestions.find(q=>q.id==='1091')!;
    expect(q.answer).toBe('060.');
    expect(q.options).toContain('060.');
    expect(q.choiceIssue).toBeUndefined();
    expect(correctAnswer(q,'060.')).toBe(true);
    expect(correctAnswer(q,'60.')).toBe(false);
  });
  it('aísla las alternativas obsoletas conservando la respuesta del archivo', () => {
    const q=allQuestions[0];
    const result=resolvePracticeOptions(q.id,q.prompt,'Nueva respuesta del archivo.');
    expect(result.options).toEqual([]);
    expect(result.choiceIssue).toContain(q.id);
    const changed={...q,answer:'Nueva respuesta del archivo.',...result};
    expect(changed.answer).toBe('Nueva respuesta del archivo.');
    expect(availableQuestions([changed,allQuestions[1]])).toEqual([allQuestions[1]]);
  });
  it('una pregunta nueva sin alternativas no bloquea las demás', () => {
    expect(resolvePracticeOptions('1999','Pregunta nueva','Respuesta').choiceIssue).toBeTruthy();
    expect(availableQuestions(allQuestions)).toHaveLength(300);
  });
});

it('interpreta comillas de protección sin eliminar ceros ni alterar el fragmento fuente', () => {
  for (const value of ['"060".', '“060”.', '"060."', '060.']) expect(parseSourceAnswer(value)).toBe('060.');
  expect(parseSourceAnswer('"016".')).toBe('016.');
  expect(parseSourceAnswer('"0,5".')).toBe('0,5.');
  const q = allQuestions.find(q => q.id === '5059')!;
  expect(q.answer).toBe('016.');
  expect(q.fragment).toContain('- "016".');
  expect(correctAnswer(q, '16.')).toBe(false);
});
