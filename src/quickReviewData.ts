import raw from '../CCSE26/Repasos1a5.md?raw';
export const QUICK_SOURCE = 'CCSE26/Repasos1a5.md';
export interface QuickSection { id: string; taskId: number; title: string; kind: 'memory' | 'traps'; markdown: string; line: number }
export function parseQuickReview(text: string): QuickSection[] {
  const sections: QuickSection[] = [];
  let current: QuickSection | undefined;
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const heading = lines[i].match(/^#{1,6}\s+(.+?TAREA\s+([1-5]))\s*$/i);
    if (heading) {
      const kind = /TRAMPAS/i.test(heading[1]) ? 'traps' : 'memory';
      const id = `quick-${heading[2]}-${kind}`;
      if (sections.some(s => s.id === id)) throw new Error(`${QUICK_SOURCE}: sección duplicada ${id}`);
      current = { id, taskId: Number(heading[2]), title: heading[1], kind, markdown: '', line: i + 1 };
      sections.push(current);
    } else if (current) current.markdown += `${lines[i]}\n`;
    else if (lines[i].trim() && lines[i].trim() !== '---') throw new Error(`${QUICK_SOURCE}:${i + 1}: contenido sin tarea`);
  }
  for (const id of [1,2,3,4,5]) {
    for (const kind of ['memory','traps']) if (!sections.some(s => s.taskId === id && s.kind === kind && s.markdown.trim())) throw new Error(`${QUICK_SOURCE}: falta ${kind} de tarea ${id}`);
  }
  return sections;
}
export const quickSections = parseQuickReview(raw);
