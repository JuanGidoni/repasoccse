import { describe, expect, it } from 'vitest';
import { studyBlocks } from './studyFormat';
import { distractors, practiceOptions } from './choices';
import { allQuestions } from './content';

describe('Alternativas de práctica revisadas', () => {
  it('cubre únicamente las 264 preguntas de tres opciones', () => {
    expect(distractors.size).toBe(264);
    expect([...distractors.keys()].sort()).toEqual(allQuestions.filter(q => q.taskId !== 2).map(q => q.id).sort());
  });
  it('exige revisar alternativas si cambia la pregunta o la respuesta fuente', () => {
    const q = allQuestions[0];
    expect(() => practiceOptions(q.id, q.prompt + ' Cambio', q.answer)).toThrow(/Revisa/);
    expect(() => practiceOptions(q.id, q.prompt, 'Respuesta modificada.')).toThrow(/Revisa/);
    expect(() => practiceOptions('9999', 'Nueva', 'Respuesta')).toThrow(/Revisa/);
  });
});
describe('Formato de apuntes sin reescritura de contenido', () => {
  it('transforma asociaciones en definiciones manteniendo cifras y cadenas', () => {
    expect(studyBlocks('**Constitución → 1978**\n\nCanarias → Teide → Tenerife')).toEqual([{kind:'facts',rows:[{label:'Constitución',value:'1978'},{label:'Canarias',value:'Teide → Tenerife'}]}]);
  });
  it('conserva notas, advertencias, listas anidadas y párrafos', () => {
    const text = '> ⚠️ Oficial → Palacio Real\n\n- Primera idea\n  - Segundo nivel\n\n**Importante:** conserva las excepciones.';
    expect(studyBlocks(text)).toEqual([{kind:'markdown',text}]);
  });
  it('conserva el orden y las advertencias entre grupos de conceptos', () => {
    const blocks = studyBlocks('A → B\n\n⚠️ No confundir\n\nC → D');
    expect(blocks.map(b => b.kind)).toEqual(['facts','markdown','facts']);
    expect(blocks[1]).toEqual({kind:'markdown',text:'⚠️ No confundir\n'});
  });
});
