import QuickReview from './QuickReview';
import SourceLink from './SourceLink';
import { useEffect, useRef, useState } from 'react';
import StudyContent from './StudyContent';
import type { CSSProperties } from 'react';
import { tasks, allQuestions, type Question } from './content';
import { correctAnswer, decodeProgress, EXAM_SIZE, finishAttempt, freshProgress, PASS_RATE, recordResponse, sample, STORAGE_KEY, unlocked, type Attempt, type Mode, type Progress, type Response } from './engine';

type View = 'quick' | 'study' | 'practice' | 'exam' | 'review';
interface Session { id: string; mode: Mode; taskId: number; questions: Question[]; responses: Response[] }
const labels: Record<View, string> = { study: 'Estudiar', quick: 'Repaso rápido', practice: 'Practicar', exam: 'Mi progreso', review: 'Mis fallos' };
const modeLabels: Record<Mode, string> = { practice: 'Práctica', exam: 'Examen', review: 'Repaso de fallos' };
function initialState() {
  try { return { data: decodeProgress(localStorage.getItem(STORAGE_KEY)), error: '' }; }
  catch { return { data: freshProgress(), error: 'No se pudo leer el progreso guardado. Puedes continuar en esta sesión; no sobrescribiremos los datos anteriores.' }; }
}
function SourceAnswer({ q }: { q: Question }) {
  return <details className="answer"><summary><span className="code">{q.id}</span> {q.prompt}<span className="answer-reveal">Ver respuesta ↓</span></summary><p><strong>Respuesta del archivo:</strong> {q.answer}</p><SourceLink q={q}/></details>;
}
export default function App() {
  const [initial] = useState(initialState);
  const [progress, setProgress] = useState<Progress>(initial.data);
  const [storageError, setStorageError] = useState(initial.error);
  const [view, setView] = useState<View>('study');
  const [taskId, setTaskId] = useState(initial.data.last.taskId);
  const [unitId, setUnitId] = useState(initial.data.last.unitId);
  const [query, setQuery] = useState('');
  const [size, setSize] = useState(10);
  const [session, setSession] = useState<Session | null>(null);
  const [readingSize, setReadingSize] = useState(17);
  const [focusReading, setFocusReading] = useState(false);
  const [submitted, setSubmitted] = useState<Response | null>(null);
  const [result, setResult] = useState<Attempt | null>(null);
  const [leaving, setLeaving] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const task = tasks[taskId - 1];
  const unit = task.units.find(u => u.id === unitId) ?? task.units[0];
  const mistakes = allQuestions.filter(q => progress.mistakes[q.id] && !correctAnswer(q, progress.mistakes[q.id].input));
  const filteredQuestions = task.questions.filter(q => `${q.id} ${q.prompt} ${q.answer}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')));
  const selectedUnits = query ? task.units.filter(u => `${u.title} ${u.markdown}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'))) : [unit];
  const q = session?.questions[session.responses.length];
  useEffect(() => {
    if (initial.error) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); setStorageError(''); }
    catch { setStorageError('No se pudo guardar en este navegador. Tu progreso sigue disponible durante esta sesión.'); }
  }, [progress, initial.error]);
  useEffect(() => {
    if (!session) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [session]);
  useEffect(() => { heading.current?.focus(); }, [session?.responses.length, result]);
  function selectTask(id: number) {
    const first = tasks[id - 1].units[0].id;
    setTaskId(id); setUnitId(first); setQuery(''); setResult(null);
    setProgress(p => ({ ...p, last: { taskId: id, unitId: first } }));
  }
  function selectUnit(id: string) {
    setUnitId(id); setQuery('');
    setProgress(p => ({ ...p, last: { taskId, unitId: id } }));
  }
  function start(mode: Mode, pool = task.questions) {
    if (mode === 'exam' && !unlocked(progress, taskId)) return;
    const questions = sample(pool, mode === 'exam' ? EXAM_SIZE : size).map(q => ({ ...q, options: q.options.length === 2 ? [...q.options] : sample(q.options, q.options.length) }));
    if (!questions.length) return;
    setSession({ id: crypto.randomUUID(), mode, taskId, questions, responses: [] });
    setSubmitted(null); setResult(null); setLeaving(false);
  }
  function submit(value: string) {
    if (!q || submitted || !value.trim()) return;
    const response = { questionId: q.id, input: value.trim(), correct: correctAnswer(q, value), expected: q.answer };
    setSubmitted(response);
    setProgress(p => recordResponse(p, response));
  }
  function next() {
    if (!session || !submitted) return;
    const responses = [...session.responses, submitted];
    if (responses.length === session.questions.length) {
      const attempt: Attempt = { id: session.id, taskId: session.taskId, mode: session.mode, date: new Date().toISOString(), responses, score: responses.filter(r => r.correct).length, total: responses.length };
      setProgress(p => finishAttempt(p, attempt)); setResult(attempt); setSession(null);
    } else setSession({ ...session, responses });
    setSubmitted(null);
  }
  const completeCount = progress.passed.length;
  return <div className="app-shell">
    <a className="skip-link" href="#main">Saltar al contenido</a>
    <aside className="sidebar">
      <a href="#main" className="brand"><span className="brand-mark">r.</span><span>repaso<span className="brand-sub">CCSE · EDICIÓN 2026</span></span></a>
      <div className="sidebar-caption">TU ESPACIO DE ESTUDIO</div>
      <nav aria-label="Modos de estudio" className="mode-nav">{(Object.keys(labels) as View[]).map((key, i) => <button key={key} disabled={!!session} aria-current={view === key ? 'page' : undefined} onClick={() => { setView(key); setResult(null); setQuery(''); }}><span aria-hidden="true">{['▤', 'ϟ', '✎', '◉', '↺'][i]}</span>{labels[key]}{key === 'review' && <span className="badge">{mistakes.length}</span>}</button>)}</nav>
      <div className="sidebar-caption mt-8">LAS CINCO TAREAS</div>
      <nav className="task-nav" aria-label="Tareas">{tasks.map(t => <button key={t.id} disabled={!!session} className={taskId === t.id ? 'selected' : ''} aria-current={taskId === t.id ? 'true' : undefined} onClick={() => selectTask(t.id)}><span className="task-number">{progress.passed.includes(t.id) ? '✓' : `0${t.id}`}</span><span><small>TAREA {t.id}</small>{t.title}</span></button>)}</nav>
      <div className="sidebar-progress"><div className="flex justify-between"><strong>Tu recorrido</strong><span>{completeCount}/5</span></div><progress value={completeCount} max={5} aria-label="Tareas superadas"/><p>{completeCount === 5 ? '¡Has superado las cinco tareas!' : 'Un paso más cerca de tu objetivo.'}</p><small>Guardado en este navegador</small></div>
    </aside>
    <main id="main" className="main">
      <header className="topbar"><span>MI CUADERNO <span className="separator">/</span> {session ? modeLabels[session.mode] : labels[view]}</span><span className="edition"><span className="status-dot"/> CCSE 2026</span></header>
      {storageError && <p className="notice" role="alert">{storageError}</p>}
      {session && q ? <section className="quiz-wrap">
        <div className="flex items-center justify-between gap-4"><span className="eyebrow">{modeLabels[session.mode]} · Tarea {q.taskId}</span><button className="text-button" onClick={() => setLeaving(true)}>Salir del intento</button></div>
        {leaving && <div className="notice" role="alert"><p>¿Salir? El intento incompleto no contará. Las respuestas ya corregidas se conservan en tus fallos.</p><div className="flex gap-3"><button className="secondary" onClick={() => setLeaving(false)}>Seguir aquí</button><button className="primary" onClick={() => { setSession(null); setLeaving(false); }}>Salir</button></div></div>}
        <div className="quiz-progress"><span>Pregunta {session.responses.length + 1} de {session.questions.length}</span><span>{Math.round(session.responses.length / session.questions.length * 100)} %</span></div>
        <progress value={session.responses.length} max={session.questions.length} aria-label="Progreso del intento"/>
        <article className="card question-card"><span className="tag">PREGUNTA {q.id}</span><h1 ref={heading} tabIndex={-1}>{q.prompt}</h1>
          <fieldset disabled={!!submitted}><legend>Selecciona una respuesta</legend><div className="choice-list">{q.options.map((option, index) => {
            const correct = !!submitted && correctAnswer(q, option);
            const chosen = submitted?.input === option;
            return <button className={`choice-option ${submitted ? correct ? 'correct' : chosen ? 'incorrect' : 'muted' : ''}`} aria-label={option} key={option} onClick={() => submit(option)}>
              <span className="choice-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span><span className="choice-text">{option}</span>
              {submitted && (correct || chosen) && <span className="choice-status">{correct ? '✓ Correcta' : '✕ Tu elección'}</span>}
            </button>;
          })}</div></fieldset>
          <p className="help">{q.options.length === 2 ? 'Verdadero o falso, según tus apuntes.' : 'Opciones de práctica: la respuesta correcta procede de tus apuntes; las alternativas no son las oficiales.'}</p>
          {submitted && <div aria-live="polite" className={`feedback ${submitted.correct ? 'success' : 'failure'}`}><strong>{submitted.correct ? '✓ Respuesta correcta' : '↺ Respuesta incorrecta'}</strong><p>Respuesta del archivo: <b>{q.answer}</b></p><SourceLink q={q}/><button className="primary mt-4" onClick={next}>{session.responses.length + 1 === session.questions.length ? 'Ver resultado' : 'Siguiente pregunta →'}</button></div>}
        </article><p className="help text-center">La corrección usa únicamente los archivos de estudio.</p>
      </section> : result ? <section className="content-wrap"><span className="eyebrow">INTENTO COMPLETADO · {modeLabels[result.mode]}</span><h1 ref={heading} tabIndex={-1}>{result.score / result.total >= PASS_RATE ? 'Buen trabajo. Sigue avanzando.' : 'Cada intento te ayuda a aprender.'}</h1><div className="card result-card"><div className="result-score">{result.score}<span> / {result.total}</span></div><p>{Math.round(result.score / result.total * 100)} % de aciertos · {result.total - result.score} errores</p>{result.mode === 'exam' && <p>{result.score / result.total >= PASS_RATE ? (result.taskId === 5 ? '¡Recorrido completo! Has superado la última tarea.' : `Tarea superada. La tarea ${result.taskId + 1} está desbloqueada.`) : 'Necesitas 16 de 20 respuestas correctas. Puedes volver a intentarlo.'}</p>}<div className="flex flex-wrap gap-3 mt-6"><button className="primary" onClick={() => { const mode = result.mode; setResult(null); start(mode, mode === 'review' ? mistakes : task.questions); }} disabled={result.mode === 'review' && !mistakes.length}>Otro intento</button><button className="secondary" onClick={() => { setResult(null); setView('review'); }}>Repasar mis fallos</button><button className="text-button" onClick={() => { setResult(null); setView('study'); }}>Volver a estudiar</button></div></div><h2>Revisión de tus respuestas</h2>{result.responses.map(r => <div className="card review-row" key={r.questionId}><span className={r.correct ? 'green' : 'orange'}>{r.correct ? '✓ Correcta' : '↺ Para repasar'} · {r.questionId}</span><h3>{allQuestions.find(q => q.id === r.questionId)?.prompt}</h3><p>Tu respuesta: {r.input}</p><p><strong>Respuesta usada en este intento:</strong> {r.expected}</p>{allQuestions.find(q => q.id === r.questionId) && <SourceLink q={allQuestions.find(q => q.id === r.questionId)!}/>}</div>)}</section> : <section className={`content-wrap ${focusReading && view === 'study' ? 'focus-reading' : ''}`} style={{ '--reading-size': `${readingSize}px` } as CSSProperties}>
        <div className="page-heading"><div><span className="eyebrow">{view === 'review' ? 'APRENDE DE CADA INTENTO' : `TAREA 0${taskId} · CCSE 2026`}</span><h1>{view === 'quick' ? 'Repaso ultrarrápido' : view === 'study' ? task.title : view === 'practice' ? 'Aprender también es practicar.' : view === 'exam' ? 'Tu siguiente paso.' : 'Lo que merece otra vuelta.'}</h1><p className="subtitle">{view === 'quick' ? 'Lo esencial y las trampas de cada tarea, siempre a mano.' : view === 'study' ? 'Lee con calma, conecta ideas y quédate con lo importante.' : view === 'practice' ? 'Preguntas aleatorias, a tu ritmo y con corrección al momento.' : view === 'exam' ? 'Supera cada tarea para desbloquear el siguiente examen.' : 'Aquí se reúnen tus respuestas pendientes de afianzar.'}</p></div><span className="page-icon" aria-hidden="true">{view === 'quick' ? 'ϟ' : view === 'study' ? '▤' : view === 'practice' ? '✎' : view === 'exam' ? '◉' : '↺'}</span></div>
        {view === 'quick' && <QuickReview taskId={taskId} onTask={selectTask} onPractice={() => setView('practice')}/>}
        {view === 'study' && <><div className="stat-strip"><span><b>{task.questions.length}</b> preguntas</span><span><b>{task.units.length}</b> secciones</span><span><b>{task.units.filter(u => progress.read.includes(u.id)).length}</b> leídas</span><button className="text-button ml-auto" onClick={() => setView('practice')}>Practicar esta tarea →</button></div>
          <label className="search-label" htmlFor="search">Buscar en esta tarea</label><input id="search" className="search" placeholder="Busca un concepto, una pregunta o un número…" value={query} onChange={e => setQuery(e.target.value)}/>
          <div className="reading-toolbar"><span>Lectura cómoda · a tu ritmo</span><div className="reading-controls" role="group" aria-label="Preferencias de lectura"><button aria-label="Reducir tamaño del texto" disabled={readingSize <= 15} onClick={() => setReadingSize(s => s - 1)}>A−</button><span aria-live="polite">{readingSize} px</span><button aria-label="Aumentar tamaño del texto" disabled={readingSize >= 22} onClick={() => setReadingSize(s => s + 1)}>A+</button><button aria-pressed={focusReading} onClick={() => setFocusReading(s => !s)}>{focusReading ? 'Ver índice' : 'Modo lectura'}</button></div></div><div className="study-layout"><nav aria-label="Secciones del apunte" className="unit-nav"><span className="eyebrow">EN ESTA TAREA</span><select aria-label="Ir a una sección" value={unit.id} onChange={e => selectUnit(e.target.value)} className="mobile-units">{task.units.map(u => <option key={u.id} value={u.id}>{u.title}</option>)}</select><div className="desktop-units">{task.units.map(u => <button key={u.id} aria-current={!query && unit.id === u.id ? 'location' : undefined} className={`${unit.id === u.id && !query ? 'active' : ''} ${u.parentId ? 'nested' : ''}`} onClick={() => selectUnit(u.id)}>{progress.read.includes(u.id) && <span className="green">✓ </span>}{u.title}</button>)}</div></nav>
          <div className="reading-pane">{query && <p className="help">{selectedUnits.length} secciones y {filteredQuestions.length} preguntas encontradas</p>}{selectedUnits.map(u => <article className="card reading" key={u.id}><div className="flex items-start justify-between gap-4"><h2>{u.title}</h2><button className="read-button" aria-pressed={progress.read.includes(u.id)} onClick={() => setProgress(p => ({ ...p, read: p.read.includes(u.id) ? p.read.filter(id => id !== u.id) : [...p.read, u.id] }))}>{progress.read.includes(u.id) ? '✓ Leído' : 'Marcar leído'}</button></div><StudyContent markdown={u.markdown}/>{task.units.filter(child => child.parentId === u.id).length > 0 && <div className="child-links">{task.units.filter(child => child.parentId === u.id).map(child => <button className="secondary" key={child.id} onClick={() => selectUnit(child.id)}>{child.title} →</button>)}</div>}{!query && u.questionIds.map(id => <SourceAnswer key={id} q={task.questions.find(q => q.id === id)!}/>)}<footer>{task.source} · Contenido de tus apuntes</footer></article>)}{query && filteredQuestions.map(q => <SourceAnswer key={q.id} q={q}/>)}{!query && <div className="flex justify-between gap-3"><button className="secondary" disabled={task.units.indexOf(unit) === 0} onClick={() => selectUnit(task.units[task.units.indexOf(unit) - 1].id)}>← Anterior</button><button className="primary" disabled={task.units.indexOf(unit) === task.units.length - 1} onClick={() => selectUnit(task.units[task.units.indexOf(unit) + 1].id)}>Siguiente sección →</button></div>}</div></div></>}
        {(view === 'practice' || view === 'exam') && <><div className="card setup-card"><span className="tag">TAREA {task.id} · {task.questions.length} PREGUNTAS DISPONIBLES</span><h2>{task.title}</h2><p>{view === 'exam' ? '20 preguntas aleatorias sin repetir. Aprueba con 16 aciertos (80 %) para desbloquear la siguiente tarea. Intentos ilimitados. Este es un criterio de estudio, no un simulacro oficial.' : 'Elige una tanda. Puedes practicar cualquier tarea, aunque su examen esté bloqueado.'}</p>{view === 'practice' && <label className="size-label">Preguntas por intento<select value={size} onChange={e => setSize(Number(e.target.value))}><option value={10}>10 preguntas</option><option value={20}>20 preguntas</option><option value={task.questions.length}>Todas ({task.questions.length})</option></select></label>}<p className="help">Elige entre tres opciones, o verdadero/falso en la Tarea 2. La respuesta correcta viene de tus apuntes; las otras alternativas se han preparado para practicar y no son las opciones oficiales.</p><button className="primary" disabled={view === 'exam' && !unlocked(progress, taskId)} onClick={() => start(view)}>{view === 'exam' && !unlocked(progress, taskId) ? `Supera antes la tarea ${taskId - 1}` : view === 'exam' ? 'Comenzar examen →' : 'Comenzar práctica →'}</button></div>{view === 'exam' && <div className="journey">{tasks.map(t => <button className={`card journey-step ${progress.passed.includes(t.id) ? 'passed' : ''}`} key={t.id} onClick={() => selectTask(t.id)}><span>{progress.passed.includes(t.id) ? '✓' : unlocked(progress, t.id) ? '○' : '—'}</span><b>Tarea {t.id}</b><small>{progress.passed.includes(t.id) ? 'Superada' : unlocked(progress, t.id) ? 'Disponible' : 'Bloqueada'}</small><small>Mejor: {Math.round((progress.best[`exam-${t.id}`] ?? 0) * 100)} %</small></button>)}</div>}<h2>Historial de {view === 'exam' ? 'exámenes' : 'prácticas'} · Tarea {taskId}</h2>{progress.attempts.filter(a => a.taskId === taskId && a.mode === view).length === 0 && <div className="empty">Tu primer intento empieza aquí. Los resultados aparecerán en este espacio.</div>}{progress.attempts.filter(a => a.taskId === taskId && a.mode === view).map(a => <button className="history-row" key={a.id} onClick={() => setResult(a)}><span>{new Date(a.date).toLocaleString('es')}</span><b>{a.score}/{a.total} aciertos</b><span>{a.total - a.score} errores · Ver detalle →</span></button>)}</>}
        {view === 'review' && <><div className="card setup-card"><span className="tag">REPASO PERSONAL</span><h2>{mistakes.length ? `${mistakes.length} preguntas pendientes` : 'Sin fallos pendientes'}</h2><p>{mistakes.length ? 'Mezcla los fallos de las cinco tareas. Cada pregunta sale de esta lista cuando la respondes correctamente.' : 'Cuando falles una pregunta, aparecerá aquí para que puedas volver a practicarla.'}</p><button className="primary" disabled={!mistakes.length} onClick={() => start('review', mistakes)}>Repasar hasta {size} fallos →</button></div>{mistakes.map(q => <SourceAnswer key={q.id} q={q}/>)}</>}
        <details className="source-note"><summary>Sobre el material y la corrección</summary><p>Fuente de preguntas y corrección: CCSE26/PreguntasyRespuestas.md. El repaso rápido procede de CCSE26/Repasos1a5.md; la teoría detallada, de Tarea1.md a Tarea5.md. Las alternativas incorrectas están revisadas por pregunta y se identifican como opciones de práctica, no oficiales. Son resúmenes de estudio; la app no verifica sus afirmaciones con fuentes externas. Los cambios en los archivos se incorporan al arrancar o reconstruir la aplicación.</p><p>Discrepancias del banco: la 1091 responde «60» frente al «060» de la teoría; la 5059 responde «16» frente al «016» de Tarea5.md y del repaso. Se conserva literalmente la respuesta de PreguntasyRespuestas.md. El encabezado de preguntas de Tarea 2 menciona 120, pero contiene 36; el contador usa las preguntas realmente presentes.</p><p>El progreso se guarda solo en este navegador. Los intentos incompletos no se reanudan al cerrar; sus respuestas corregidas sí se conservan. Marcar secciones como leídas no desbloquea exámenes.</p></details>
      </section>}
    </main>
  </div>;
}
