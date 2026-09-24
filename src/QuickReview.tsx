import { useState } from 'react';
import type { CSSProperties } from 'react';
import { tasks } from './content';
import { quickSections, QUICK_SOURCE } from './quickReviewData';
import StudyContent from './StudyContent';

export default function QuickReview({ taskId, onTask, onPractice }: { taskId: number; onTask: (id: number) => void; onPractice: () => void }) {
  const [filter, setFilter] = useState('');
  const [size, setSize] = useState(16);
  const [kind, setKind] = useState<'all' | 'memory' | 'traps'>('all');
  const sections = quickSections.filter(s => s.taskId === taskId && (kind === 'all' || s.kind === kind));
  // Search filters complete source lines, retaining each concept and its answer.
  const visible = sections.map(section => ({ ...section, markdown: filter.trim()
    ? section.markdown.split('\n').filter(line => line.toLocaleLowerCase('es').includes(filter.trim().toLocaleLowerCase('es'))).join('\n')
    : section.markdown })).filter(section => section.markdown.trim());
  return <div className="quick-review" style={{ '--reading-size': `${size}px` } as CSSProperties}>
    <nav className="quick-task-tabs" aria-label="Tareas del repaso rápido">{tasks.map(t => <button key={t.id} aria-pressed={t.id === taskId} onClick={() => { onTask(t.id); setFilter(''); }}><b>0{t.id}</b><span>{t.title}</span></button>)}</nav>
    <div className="quick-controls"><label htmlFor="quick-search">Encuentra un dato<input id="quick-search" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Por ejemplo: Constitución, 18, IVA…"/></label><div className="reading-controls" role="group" aria-label="Letra del repaso"><button aria-label="Reducir letra del repaso" disabled={size <= 15} onClick={() => setSize(n => n - 1)}>A−</button><button aria-label="Aumentar letra del repaso" disabled={size >= 22} onClick={() => setSize(n => n + 1)}>A+</button></div></div>
    <div className="quick-filter" role="group" aria-label="Contenido del repaso">{([['all','Todo'],['memory','Para memorizar'],['traps','Trampas']] as const).map(([key,label]) => <button key={key} aria-pressed={kind === key} onClick={() => setKind(key)}>{label}</button>)}<button className="text-button" onClick={onPractice}>Practicar tarea {taskId} →</button></div>
    <div className="quick-sections">{visible.map(section => <section className={`card quick-block ${section.kind}`} key={section.id} id={section.id}><header><span className="eyebrow">TAREA {taskId}</span><h2>{section.kind === 'memory' ? 'Lo esencial, de un vistazo' : 'Ojo con estas trampas'}</h2><a href={`#${section.id}`} className="section-anchor" aria-label={`Enlace a ${section.title}`}>#</a></header><StudyContent markdown={section.markdown} associationsWithEquals/><footer>{QUICK_SOURCE} · línea {section.line}</footer></section>)}</div>
    {!visible.length && <p className="empty" role="status">No hay coincidencias en esta tarea. Prueba otra palabra o cambia el filtro.</p>}
  </div>;
}
