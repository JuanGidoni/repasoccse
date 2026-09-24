import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseQuestionBank, QUESTION_SOURCE } from './questionBank';
import { allQuestions, attachQuestionBank, parseTask } from './content';
import { parseQuickReview, quickSections, QUICK_SOURCE } from './quickReviewData';
import { studyBlocks } from './studyFormat';

describe('Fuente central de preguntas y fragmentos', () => {
  it('conserva el fragmento literal y las líneas de las 300 preguntas', () => {
    const lines = readFileSync(QUESTION_SOURCE, 'utf8').split(/\r?\n/);
    expect(allQuestions).toHaveLength(300);
    for (const q of allQuestions) {
      expect(q.source).toBe(QUESTION_SOURCE);
      expect(q.fragment).toBe(lines.slice(q.line - 1, q.endLine).join('\n'));
      expect(q.fragment).toContain(q.prompt);
      expect(q.fragment).toContain(`- ${q.answer}`);
    }
  });
  it('usa el banco central incluso cuando el apunte antiguo discrepa', () => {
    const task = parseTask('# Tema\n1 (1001). Pregunta antigua\n- Respuesta antigua', 1);
    const bank = parseQuestionBank('1001. Pregunta nueva\n\n- Respuesta nueva');
    const result = attachQuestionBank(task, bank);
    expect(result.questions[0].prompt).toBe('Pregunta nueva');
    expect(result.questions[0].answer).toBe('Respuesta nueva');
    expect(result.questions[0].sourceNote).toContain('Respuesta antigua');
    expect(allQuestions.find(q => q.id === '5059')?.answer).toBe('16.');
    expect(allQuestions.find(q => q.id === '5059')?.sourceNote).toContain('016.');
  });
  it('permite apuntes de teoría sin preguntas duplicadas y añade una sección del banco', () => {
    const task = parseTask('# Teoría\nTexto de estudio', 1);
    const bank = parseQuestionBank('1001. Nueva\n\n- Respuesta');
    const result = attachQuestionBank(task, bank);
    expect(result.questions).toHaveLength(1);
    expect(result.units.find(u => u.id === result.questions[0].unitId)?.questionIds).toEqual(['1001']);
  });
  it('rechaza bancos vacíos, preguntas sin respuesta, IDs repetidos y líneas mal formadas', () => {
    for (const raw of ['', '1001. A', '1001. A\n- Sí\n1001. B\n- No', '1001) A\n- Sí', '6001. A\n- Sí', '1001. A\n- Sí\n- Otra']) expect(() => parseQuestionBank(raw)).toThrow();
  });
});
describe('Repaso ultrarrápido a partir del archivo', () => {
  it('incluye memorización y trampas para las cinco tareas', () => {
    expect(quickSections).toHaveLength(10);
    for (const id of [1,2,3,4,5]) expect(quickSections.filter(s => s.taskId === id).map(s => s.kind)).toEqual(['memory','traps']);
  });
  it('no pierde texto: cada sección reproduce todas sus líneas fuente', () => {
    const lines = readFileSync(QUICK_SOURCE,'utf8').replace(/\r\n/g,'\n').split('\n');
    for (let i = 0; i < quickSections.length; i++) {
      const section = quickSections[i];
      const end = quickSections[i + 1]?.line ? quickSections[i + 1].line - 1 : lines.length;
      expect(section.markdown).toBe(lines.slice(section.line, end).map(line => line+'\n').join(''));
    }
  });
  it('formatea las equivalencias de las trampas sin cambiar su contenido', () => {
    expect(studyBlocks('Palacio Real = residencia oficial del rey.', true)).toEqual([{ kind:'facts',rows:[{label:'Palacio Real',value:'residencia oficial del rey.'}] }]);
    expect(studyBlocks('Palacio Real = residencia oficial del rey.')).toEqual([{ kind:'markdown',text:'Palacio Real = residencia oficial del rey.' }]);
  });
  it('falla si una tarea está ausente o una sección se duplica', () => {
    expect(() => parseQuickReview('## MEMORIZACIÓN TAREA 1\nDato')).toThrow();
    expect(() => parseQuickReview(readFileSync(QUICK_SOURCE,'utf8')+'\n## TRAMPAS TAREA 1\nOtro')).toThrow();
  });
});
