export type StudyBlock = { kind: 'markdown'; text: string } | { kind: 'facts'; rows: { label: string; value: string }[] };
// Only full, standalone association lines are reformatted. Lists, quotations,
// explanatory paragraphs and nested Markdown retain their original structure.
export function studyBlocks(markdown: string, associationsWithEquals = false): StudyBlock[] {
  const blocks: StudyBlock[] = [];
  let text: string[] = [];
  let rows: { label: string; value: string }[] = [];
  const flushText = () => { if (text.join('\n').trim()) blocks.push({ kind: 'markdown', text: text.join('\n') }); text = []; };
  const flushRows = () => { if (rows.length) blocks.push({ kind: 'facts', rows }); rows = []; };
  for (const line of markdown.split('\n')) {
    const plain = line.trim().replace(/\*\*/g, '');
    const arrow = plain.includes('→') ? plain.indexOf('→') : associationsWithEquals ? plain.indexOf(' = ') : -1;
    const separatorSize = plain.includes('→') ? 1 : 3;
    const isFact = arrow > 0 && arrow < plain.length - 1 && !/^(?:[>#*\-]|\d+\.|🔥|⚠)/u.test(plain) && !/^\s+[-*]/.test(line);
    if (isFact) {
      flushText();
      rows.push({ label: plain.slice(0, arrow).trim(), value: plain.slice(arrow + separatorSize).trim() });
    } else if (!line.trim() && rows.length) {
      // Blank spacing between association lines stays a single definition list.
    } else { flushRows(); text.push(line); }
  }
  flushRows(); flushText();
  return blocks;
}
