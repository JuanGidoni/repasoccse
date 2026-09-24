import raw from './data/distractors.tsv?raw';

// These are authored practice distractors, not the official exam alternatives.
// The fingerprint forces review if the source question/answer changes.
export function fingerprint(prompt: string, answer: string): string {
  let value = 2166136261;
  for (const character of `${prompt}\n${answer}`) {
    value ^= character.codePointAt(0)!;
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0).toString(16);
}
const normalize = (s: string) => s.normalize('NFC').toLocaleLowerCase('es').trim().replace(/[.!?…]+$/u, '').replace(/\s+/g, ' ');
export const distractors = new Map<string, { choices: string[]; fingerprint: string }>();
for (const line of raw.trim().split(/\r?\n/)) {
  if (line.startsWith('#')) continue;
  const [id, hash, ...choices] = line.split('\t');
  if (distractors.has(id) || choices.length !== 2 || choices.some(c => !c.trim())) throw new Error(`Alternativas mal formadas: ${id}`);
  distractors.set(id, { choices, fingerprint: hash });
}
export function practiceOptions(id: string, prompt: string, answer: string): string[] {
  if (/^(verdadero|falso)\.?$/i.test(answer)) return ['Verdadero', 'Falso'];
  const record = distractors.get(id);
  if (!record || record.fingerprint !== fingerprint(prompt, answer)) throw new Error(`Revisa las alternativas de práctica de la pregunta ${id}: falta la ficha o ha cambiado el apunte.`);
  const options = [answer, ...record.choices];
  if (new Set(options.map(normalize)).size !== 3) throw new Error(`Opciones repetidas o equivalentes en ${id}`);
  return options;
}

// Invalid alternatives disable only this question, never the entire application.
export function resolvePracticeOptions(id: string, prompt: string, answer: string): { options: string[]; choiceIssue?: string } {
  try { return { options: practiceOptions(id, prompt, answer) }; }
  catch (error) { return { options: [], choiceIssue: error instanceof Error ? error.message : 'Alternativas pendientes de revisión' }; }
}
