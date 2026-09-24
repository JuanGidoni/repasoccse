import type { Question } from './content';
export const QUESTION_SOURCE = 'CCSE26/PreguntasyRespuestas.md';
const plain = (s: string) => s.replace(/\*\*/g, '').trim();

/** Central bank only: ID. prompt, blank lines, then one answer bullet. */
export function parseQuestionBank(raw: string): Question[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const questions: Question[] = [];
  const ids = new Set<string>();
  for (let i = 0; i < lines.length; i++) {
    const line = plain(lines[i]);
    const match = line.match(/^([1-5]\d{3})\.\s+(.+)$/);
    if (!match) {
      if (/^\d+[.)]/.test(line) || /^-\s/.test(line)) throw new Error(`${QUESTION_SOURCE}:${i + 1}: formato de pregunta no reconocido`);
      continue;
    }
    const [, id, prompt] = match;
    if (ids.has(id)) throw new Error(`${QUESTION_SOURCE}: ID repetido ${id}`);
    let answerLine = i + 1;
    while (answerLine < lines.length && !lines[answerLine].trim()) answerLine++;
    const answer = lines[answerLine]?.match(/^\s*-\s+(.+)$/);
    if (!answer || !plain(answer[1])) throw new Error(`${QUESTION_SOURCE}:${i + 1}: falta la respuesta de ${id}`);
    const taskId = Number(id[0]);
    questions.push({ id, taskId, unitId: `${taskId}-question-bank`, prompt, answer: plain(answer[1]), options: [], source: QUESTION_SOURCE, line: i + 1, endLine: answerLine + 1, fragment: lines.slice(i, answerLine + 1).join('\n') });
    ids.add(id); i = answerLine;
  }
  if (!questions.length) throw new Error(`${QUESTION_SOURCE}: banco vacío`);
  return questions;
}
