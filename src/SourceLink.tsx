import { useEffect, useRef, useState } from 'react';
import type { Question } from './content';

/** Native dialog supplies focus containment, Escape and focus restoration. */
export default function SourceLink({ q }: { q: Question }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, [open]);
  return <><a className="source-link" href={`#fuente-${q.id}`} aria-haspopup="dialog" onClick={e => { e.preventDefault(); setOpen(true); }}>↗ Consultar fuente · {q.id}</a>
    {open && <dialog className="source-dialog" ref={ref} aria-label={`Fuente de la pregunta ${q.id}`} onClose={() => setOpen(false)} onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) ref.current?.close(); } }}>
      <div className="source-dialog-header"><div><span className="eyebrow">FRAGMENTO ORIGINAL · TAREA {q.taskId}</span><h2>Pregunta {q.id}</h2></div><button className="secondary" autoFocus onClick={() => ref.current?.close()} aria-label="Cerrar fuente">Cerrar ×</button></div>
      <p className="source-location">{q.source} · líneas {q.line}–{q.endLine}</p>
      <pre id={`fuente-${q.id}`} className="source-fragment">{q.fragment}</pre>
      {q.sourceNote && <p className="source-warning">{q.sourceNote}</p>}
      <p className="help">Este fragmento es la referencia utilizada para corregir la respuesta. Las opciones incorrectas son alternativas de práctica.</p>
    </dialog>}
  </>;
}
