import type { InspectorState } from '../hooks/useChat'
import './Inspector.css'

export default function Inspector({ state }: { state: InspectorState }) {
  return (
    <aside className="inspector">
      <div className="inspector-title">── Inspector ──</div>
      <div className="inspector-body">
        <InspectorContent state={state} />
      </div>
    </aside>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="insp-row">
      <span className="insp-label">{label}</span>
      <span className="insp-value">{value}</span>
    </div>
  )
}

function InspectorContent({ state }: { state: InspectorState }) {
  if (state.status === 'idle')
    return <p className="insp-dim">Waiting for input…</p>

  if (state.status === 'running')
    return (
      <>
        <Row label="Mode" value={state.mode === 'direct' ? 'Direct → Ollama' : 'Harness → ReAct'} />
        <p className="insp-dim insp-mt">Running…</p>
      </>
    )

  if (state.status === 'error')
    return <p className="insp-error">{state.message}</p>

  if (state.mode === 'direct')
    return (
      <>
        <Row label="Mode"  value="Direct → Ollama" />
        <Row label="Model" value={state.model} />
        <Row label="Time"  value={`${state.elapsed.toFixed(1)}s`} />
        <Row label="Chars" value={String(state.chars)} />
      </>
    )

  return (
    <>
      <Row label="Mode"    value="Harness → ReAct" />
      <Row label="Session" value={state.sessionId ? `${state.sessionId.slice(0, 8)}…` : '—'} />
      <Row label="Time"    value={`${state.elapsed.toFixed(1)}s`} />
      <p className="insp-dim insp-mt">Full trace → localhost:3000</p>
    </>
  )
}
