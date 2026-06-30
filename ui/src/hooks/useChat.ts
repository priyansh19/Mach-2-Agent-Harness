import { useState, useRef, useCallback } from 'react'

export type Mode = 'direct' | 'harness'
export type Message = { role: 'user' | 'assistant'; content: string }

export type InspectorState =
  | { status: 'idle' }
  | { status: 'running'; mode: Mode }
  | { status: 'done'; mode: 'direct'; model: string; elapsed: number; chars: number }
  | { status: 'done'; mode: 'harness'; sessionId: string; elapsed: number }
  | { status: 'error'; message: string }

const DIRECT_URL    = 'http://localhost:8000/direct'
const HARNESS_URL   = 'http://localhost:8000/chat'
const DEFAULT_MODEL = 'ornith:9b'

export function useChat() {
  const [mode, setMode] = useState<Mode>('direct')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [inspector, setInspector] = useState<InspectorState>({ status: 'idle' })

  const historyRef  = useRef<Message[]>([])
  const sessionRef  = useRef('')

  const appendAssistant = (content: string) =>
    setMessages(prev => {
      const next = [...prev]
      next[next.length - 1] = { role: 'assistant', content }
      return next
    })

  const send = useCallback(async (text: string) => {
    if (loading) return
    historyRef.current = [...historyRef.current, { role: 'user', content: text }]
    setMessages([...historyRef.current, { role: 'assistant', content: '' }])
    setLoading(true)
    setInspector({ status: 'running', mode })

    const t0 = performance.now()
    try {
      if (mode === 'direct') {
        const result = await fetch(DIRECT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: historyRef.current, model: DEFAULT_MODEL }),
        }).then(r => { if (!r.ok) throw new Error(`Direct ${r.status}`); return r.json() })
        const answer = result.answer ?? ''
        appendAssistant(answer)
        historyRef.current = [...historyRef.current, { role: 'assistant', content: answer }]
        setInspector({ status: 'done', mode: 'direct', model: DEFAULT_MODEL, elapsed: (performance.now() - t0) / 1000, chars: answer.length })
      } else {
        const result = await fetch(HARNESS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, session_id: sessionRef.current }),
        }).then(r => { if (!r.ok) throw new Error(`Harness ${r.status}`); return r.json() })
        const answer = result.answer ?? ''
        sessionRef.current = result.session_id ?? ''
        appendAssistant(answer)
        historyRef.current = [...historyRef.current, { role: 'assistant', content: answer }]
        setInspector({ status: 'done', mode: 'harness', sessionId: sessionRef.current, elapsed: (performance.now() - t0) / 1000 })
      }
    } catch (err) {
      appendAssistant(`⚠️ ${err}`)
      setInspector({ status: 'error', message: String(err) })
    }
    setLoading(false)
  }, [mode, loading])

  const clear = useCallback(() => {
    setMessages([])
    historyRef.current = []
    sessionRef.current = ''
    setInspector({ status: 'idle' })
  }, [])

  const switchMode = useCallback((m: Mode) => {
    setMode(m)
    setMessages([])
    historyRef.current = []
    sessionRef.current = ''
    setInspector({ status: 'idle' })
  }, [])

  return { mode, switchMode, messages, loading, inspector, send, clear }
}
