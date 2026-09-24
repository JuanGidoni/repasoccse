export interface Question {
  id: string;
  taskId: number;
  unitId: string;
  prompt: string;
  answer: string;
  options: string[];
  line: number;
}
export interface Unit {
  id: string;
  title: string;
  level: number;
  parentId?: string;
  markdown: string;
  questionIds: string[];
}
export interface Task {
  id: number;
  title: string;
  source: string;
  units: Unit[];
  questions: Question[];
}
const titles = [
  "Gobierno y participación",
  "Derechos y deberes",
  "Territorio y geografía",
  "Cultura e historia",
  "Sociedad española",
];
const clean = (s: string) =>
  s.replace(/:chatgpt-content-reference\{[^}]*\}/g, "").trim();
const plain = (s: string) => clean(s).replace(/\*\*/g, "").trim();

// Retain the source hierarchy. Questions belong to their original question-bank
// section; there is no inferred thematic mapping that could misclassify them.
export function parseTask(raw: string, id: number): Task {
  const units: Unit[] = [];
  const questions: Question[] = [];
  const stack: Unit[] = [];
  let current: Unit = {
    id: `${id}-intro`,
    title: "Introducción",
    level: 0,
    markdown: "",
    questionIds: [],
  };
  units.push(current);
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = clean(lines[i]);
    const q = plain(line).match(/^\d+\s+\((\d{4})\)\.\s+(.+)$/);
    if (q) {
      let next = i + 1;
      while (next < lines.length && !lines[next].trim()) next++;
      const a = lines[next]?.match(/^\s*-\s+(.+)$/);
      if (!a || !plain(a[1]))
        throw new Error(
          `Tarea ${id}, línea ${i + 1}: respuesta ausente para ${q[1]}`,
        );
      if (
        questions.some((item) => item.id === q[1]) ||
        !q[1].startsWith(String(id))
      )
        throw new Error(`Identificador inválido o repetido: ${q[1]}`);
      const answer = plain(a[1]);
      questions.push({
        id: q[1],
        taskId: id,
        unitId: current.id,
        prompt: q[2],
        answer,
        options: /^(verdadero|falso)\.?$/i.test(answer)
          ? ["Verdadero", "Falso"]
          : [],
        line: i + 1,
      });
      current.questionIds.push(q[1]);
      i = next;
    } else {
      // A numbered question with a changed format must never silently disappear.
      if (/\(\d{4}\)/.test(line) && /^\**\d+/.test(line))
        throw new Error(
          `Formato de pregunta no reconocido en Tarea ${id}:${i + 1}`,
        );
      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        const level = heading[1].length;
        while (stack.length && stack[stack.length - 1].level >= level)
          stack.pop();
        const slug = plain(heading[2])
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const base = `${id}-${slug}`;
        let key = base;
        for (let n = 2; units.some((u) => u.id === key); n++)
          key = `${base}-${n}`;
        current = {
          id: key,
          title: plain(heading[2]),
          level,
          parentId: stack.at(-1)?.id,
          markdown: "",
          questionIds: [],
        };
        units.push(current);
        stack.push(current);
      } else current.markdown += `${line}\n`;
    }
  }
  if (!questions.length)
    throw new Error(`Tarea ${id}: no se encontraron preguntas`);
  return {
    id,
    title: titles[id - 1],
    source: `CCSE26/Tarea${id}.md`,
    units: units.filter(
      (u) =>
        u.markdown.trim() ||
        u.questionIds.length ||
        units.some((child) => child.parentId === u.id),
    ),
    questions,
  };
}

const files = import.meta.glob("../CCSE26/Tarea*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
export const tasks = [1, 2, 3, 4, 5].map((id) => {
  const raw = files[`../CCSE26/Tarea${id}.md`];
  if (!raw) throw new Error(`Falta CCSE26/Tarea${id}.md`);
  return parseTask(raw, id);
});
export const allQuestions = tasks.flatMap((t) => t.questions);
