import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { studyBlocks } from './studyFormat';

export default function StudyContent({ markdown, associationsWithEquals = false }: { markdown: string; associationsWithEquals?: boolean }) {
  return <div className="study-content">{studyBlocks(markdown, associationsWithEquals).map((block, i) => block.kind === 'facts'
    ? <dl className="study-facts" key={i}>{block.rows.map((row, n) => <div className="study-fact" key={n}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl>
    : <div className="prose" key={i}><Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={{
      blockquote: ({ children }) => <blockquote className="study-callout">{children}</blockquote>,
    }}>{block.text}</Markdown></div>)}</div>;
}
